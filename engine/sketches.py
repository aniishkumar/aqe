import math
import numpy as np
import pandas as pd
import zlib
import hashlib


def approximate_count_distinct(series, num_buckets=1024):
    bucket_bits = int(math.log2(num_buckets))
    
    # im using VECTORIZED HASHING (C-Level)
    # pd.util.hash_pandas_object uses a highly optimized C hash function, returning 64-bit uints.
    # This completely eliminates the slow hashlib.md5 pure Python loop.
    #makes the entire value to hashfunctions
    hashes = pd.util.hash_pandas_object(series, index=False).values.astype(np.uint64)
    
    #  VECTORIZED BITWISE MATH
    # Calculate bucket indices for the entire array at once
    bucket_indices = hashes & (num_buckets - 1)
    
    # Shift array to get the remaining bits
    remaining_hashes = hashes >> bucket_bits
     
    # Vectorized calculation of bit lengths
    # np.log2 is incredibly fast for finding the highest set bit.
    with np.errstate(divide='ignore'):
        # Log2 of 0 is -inf, we handle this by explicitly setting 0s to 0 bit length
        bit_lengths = np.where(
            remaining_hashes == 0, 
            0, 
            np.floor(np.log2(remaining_hashes)) + 1
        ).astype(int)
        
    # Vectorized leading zero calculation
    leading_zeros = (64 - bucket_bits) - bit_lengths + 1
    
    #  VECTORIZED AGGREGATION
    # We use np.maximum.at to perform an in-place maximum reduction.
    # This updates the register array in C, finding the max leading zero for each bucket.
    registers = np.zeros(num_buckets, dtype=int)
    np.maximum.at(registers, bucket_indices, leading_zeros)
    
    # 4. STANDARD HLL ESTIMATION
    if num_buckets == 16:
        alpha = 0.673
    elif num_buckets == 32:
        alpha = 0.697
    elif num_buckets == 64:
        alpha = 0.709
    else:
        alpha = 0.7213 / (1 + 1.079 / num_buckets)

    # this is the main formula    
    Z = np.sum(2.0 ** (-registers))
    estimate = alpha * (num_buckets ** 2) / Z
    
    # Small range correction (LinearCounting)
    if estimate <= 2.5 * num_buckets:
        V = np.count_nonzero(registers == 0)
        if V != 0:
            estimate = num_buckets * math.log(num_buckets / V)
            
    return int(estimate)



class CountMinSketch:
    def __init__(self, width=200, depth=5):
        self.width = width
        self.depth = depth
        self.table = np.zeros((depth, width), dtype=int)

    def _hash(self, item, i):
        # i used zlib instead of md5 couz of the speed and lightweight
        return zlib.crc32(f"{item}_{i}".encode()) % self.width

    def add(self, item):
        for i in range(self.depth):
            index = self._hash(item, i)
            self.table[i, index] += 1

    def estimate(self, item):
        return min(
            self.table[i, self._hash(item, i)]
            for i in range(self.depth)
        )


# builder for frequency sketch
def build_frequency_sketch(series):
    cms = CountMinSketch()
    for item in series.values:
        cms.add(item)
    return cms