import hashlib
import math
import numpy as np


#  HyperLogLog (COUNT DISTINCT)
def approximate_count_distinct(series, num_buckets=64):
    registers = [0] * num_buckets

    for value in series:
        hash_val = int(hashlib.md5(str(value).encode()).hexdigest(), 16)

        bucket_index = hash_val & (num_buckets - 1)
        remaining_hash = hash_val >> int(math.log2(num_buckets))

        binary = bin(remaining_hash)[2:]
        leading_zeros = len(binary) - len(binary.lstrip('0')) + 1

        registers[bucket_index] = max(registers[bucket_index], leading_zeros)

    alpha = 0.7213 / (1 + 1.079 / num_buckets)
    Z = sum([2 ** (-r) for r in registers])
    estimate = alpha * (num_buckets ** 2) / Z

    if estimate <= 2.5 * num_buckets:
        V = registers.count(0)
        if V != 0:
            estimate = num_buckets * math.log(num_buckets / V)

    return int(estimate)


#  Count-Min Sketch
class CountMinSketch:
    def __init__(self, width=100, depth=5):
        self.width = width
        self.depth = depth
        self.table = np.zeros((depth, width))

    def _hash(self, item, i):
        return int(hashlib.md5(f"{item}_{i}".encode()).hexdigest(), 16) % self.width

    def add(self, item):
        for i in range(self.depth):
            index = self._hash(item, i)
            self.table[i][index] += 1

    def estimate(self, item):
        return min(
            self.table[i][self._hash(item, i)]
            for i in range(self.depth)
        )


#  Helper to build sketch
def build_frequency_sketch(series):
    cms = CountMinSketch()
    for item in series:
        cms.add(item)
    return cms