import math
import numpy as np
import pandas as pd
from typing import Dict, Union, Tuple

def get_alpha(m: int) -> float:
    """
    Computes alpha_m bias-correction factor as specified in Flajolet et al. & Heule et al. (2013).
    """
    if m == 16:
        return 0.673
    elif m == 32:
        return 0.697
    elif m == 64:
        return 0.709
    else:
        return 0.7213 / (1.0 + 1.079 / m)

def hash_series_64(series: pd.Series) -> np.ndarray:
    """
    Vectorized 64-bit hashing using pandas/numpy C-level hash function.
    Returns 64-bit unsigned integers.
    """
    hashes = pd.util.hash_pandas_object(series, index=False).values.astype(np.uint64)
    return hashes

class HyperLogLog:
    """
    HyperLogLog Cardinality Estimator based on Heule et al. (2013):
    'HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm'

    Supports:
    - Configurable precision p (4 <= p <= 18)
    - Register count m = 2^p
    - Theoretical relative error: 1.04 / sqrt(m)
    - Vectorized 64-bit hashing and register updates
    - Sparse and Dense representations
    - Small-range Linear Counting correction
    - Sketch merging via register-wise maximum
    """

    def __init__(self, p: int = 10, representation: str = "DENSE"):
        if not (4 <= p <= 18):
            raise ValueError(f"Precision p must be between 4 and 18, got {p}")
        self.p = p
        self.m = 1 << p
        self.alpha = get_alpha(self.m)
        self.representation = representation.upper()

        # Dense register array: m unsigned 8-bit integers
        self.registers = np.zeros(self.m, dtype=np.uint8)
        # Sparse register map: {register_index: register_value}
        self.sparse_registers: Dict[int, int] = {}
        # Maximum sparse entries before automatic densification
        self.sparse_threshold = min(self.m // 4, 16384)

    @property
    def theoretical_error(self) -> float:
        """Theoretical relative standard error: 1.04 / sqrt(m)"""
        return 1.04 / math.sqrt(self.m)

    def add_series(self, series: pd.Series):
        """
        Fast vectorized update of registers from a pandas Series.
        """
        if series.empty:
            return

        hashes = hash_series_64(series)
        bucket_bits = self.p

        # Register index: lowest p bits
        bucket_indices = hashes & np.uint64(self.m - 1)

        # Remaining 64 - p bits for leading zeros calculation
        remaining_hashes = hashes >> np.uint64(bucket_bits)

        # Vectorized bit-length calculation using log2
        with np.errstate(divide="ignore"):
            bit_lengths = np.where(
                remaining_hashes == 0,
                0,
                np.floor(np.log2(remaining_hashes.astype(np.float64))) + 1
            ).astype(np.int32)

        # Leading zeros count: (64 - p) - bit_lengths + 1
        leading_zeros = np.clip((64 - bucket_bits) - bit_lengths + 1, 1, 64).astype(np.uint8)

        if self.representation == "SPARSE" and len(self.sparse_registers) < self.sparse_threshold:
            # Update sparse map
            for idx, lz in zip(bucket_indices, leading_zeros):
                idx_int = int(idx)
                lz_int = int(lz)
                if lz_int > self.sparse_registers.get(idx_int, 0):
                    self.sparse_registers[idx_int] = lz_int
            
            # Check if threshold exceeded for auto-densification
            if len(self.sparse_registers) >= self.sparse_threshold:
                self.densify()
        else:
            # Dense vectorized update via in-place maximum reduction
            np.maximum.at(self.registers, bucket_indices, leading_zeros)
            if self.representation == "SPARSE":
                self.representation = "DENSE"

    def densify(self):
        """Converts sparse state into dense register array."""
        if self.representation == "SPARSE":
            for idx, val in self.sparse_registers.items():
                self.registers[idx] = max(self.registers[idx], val)
            self.representation = "DENSE"

    def estimate(self) -> float:
        """
        Calculates estimated cardinality using normalized harmonic mean
        with small-cardinality Linear Counting correction.
        """
        if self.representation == "SPARSE":
            # For sparse state with few entries, Linear Counting is highly accurate
            non_zero_count = len(self.sparse_registers)
            V = self.m - non_zero_count
            if V > 0:
                return float(self.m * math.log(self.m / V))
            # Fallback to dense registers
            self.densify()

        # Harmonic mean across registers
        # Z = sum(2^(-M[j]))
        Z = np.sum(2.0 ** (-self.registers.astype(np.float64)))
        raw_estimate = self.alpha * (self.m ** 2) / Z

        # Heule et al. Small range Linear Counting correction
        if raw_estimate <= 2.5 * self.m:
            V = int(np.count_nonzero(self.registers == 0))
            if V > 0:
                estimate = self.m * math.log(self.m / V)
            else:
                estimate = raw_estimate
        else:
            estimate = raw_estimate

        return round(float(estimate), 2)

    def merge(self, other: "HyperLogLog") -> "HyperLogLog":
        """
        Merges this sketch with another sketch with compatible precision p.
        Algorithm: element-wise maximum of registers M_merged[j] = max(M1[j], M2[j])
        """
        if self.p != other.p:
            raise ValueError(f"Cannot merge sketches with different precisions: {self.p} vs {other.p}")

        # Ensure both are densified for reliable register-wise max
        self.densify()
        other.densify()

        merged_sketch = HyperLogLog(p=self.p, representation="DENSE")
        merged_sketch.registers = np.maximum(self.registers, other.registers)
        return merged_sketch

    def get_dense_registers(self) -> np.ndarray:
        self.densify()
        return self.registers

    def get_register_dict(self) -> Dict[int, int]:
        if self.representation == "SPARSE":
            return self.sparse_registers
        return {int(i): int(v) for i, v in enumerate(self.registers) if v > 0}


def approximate_count_distinct(series: pd.Series, p: int = 10) -> int:
    """
    Convenience function returning estimated distinct count.
    """
    hll = HyperLogLog(p=p)
    hll.add_series(series)
    return int(round(hll.estimate()))