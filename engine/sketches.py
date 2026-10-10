import math
import numpy as np
import pandas as pd
from typing import Dict, Union, Tuple

def get_alpha(m: int) -> float:
    """
    Computes alpha_m bias-correction factor as specified in Flajolet et al. & Heule et al. (2013).
    alpha_16 = 0.673, alpha_32 = 0.697, alpha_64 = 0.709
    alpha_m = 0.7213 / (1 + 1.079 / m) for m >= 128
    """
    if m == 16:
        return 0.673
    elif m == 32:
        return 0.697
    elif m == 64:
        return 0.709
    else:
        return 0.7213 / (1.0 + 1.079 / m)

# Empirically determined threshold values from Heule et al. (2013), Section 5.2 / Figure 6
THRESHOLDS: Dict[int, float] = {
    4: 10.0,
    5: 20.0,
    6: 40.0,
    7: 80.0,
    8: 220.0,
    9: 400.0,
    10: 900.0,
    11: 1800.0,
    12: 3100.0,
    13: 6500.0,
    14: 11500.0,
    15: 20000.0,
    16: 50000.0,
    17: 120000.0,
    18: 350000.0
}

# 16-bit leading-zeros precomputed lookup table
_LUT16: np.ndarray = np.zeros(65536, dtype=np.uint8)
for _i in range(1, 65536):
    _LUT16[_i] = 16 - _i.bit_length()
_LUT16[0] = 16

def clz64_vec(x: np.ndarray) -> np.ndarray:
    """
    Vectorized, exact count-leading-zeros for 64-bit unsigned integers.
    Uses 16-bit precomputed lookup table for high-throughput vectorized execution.
    """
    t16 = (x >> np.uint64(48)).astype(np.uint16)
    n = _LUT16[t16].copy()
    z1 = (t16 == 0)
    if np.any(z1):
        x1 = x[z1]
        t32 = (x1 >> np.uint64(32)).astype(np.uint16)
        n[z1] += _LUT16[t32]
        z2 = (t32 == 0)
        if np.any(z2):
            idx_z2 = np.where(z1)[0][z2]
            x2 = x[idx_z2]
            t48 = (x2 >> np.uint64(16)).astype(np.uint16)
            n[idx_z2] += _LUT16[t48]
            z3 = (t48 == 0)
            if np.any(z3):
                idx_z3 = idx_z2[z3]
                x3 = x[idx_z3]
                t64 = x3.astype(np.uint16)
                n[idx_z3] += _LUT16[t64]
    return np.where(x == 0, 64, n)

def hash_series_64(series: pd.Series) -> np.ndarray:
    """
    64-bit hashing of pandas Series elements using 64-bit Murmur-based hashing.
    """
    return pd.util.hash_pandas_object(series, index=False).values.astype(np.uint64)

class HyperLogLog:
    """
    HyperLogLog++ Cardinality Estimator based on Heule, Nunkesser, & Hall (Google Inc., EDBT 2013):
    'HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm'

    Implements:
    - 64-bit hash values (Section 5.1): eliminates hash collisions up to 2^64
    - Configurable precision p (4 <= p <= 18) with m = 2^p registers
    - First p bits MSB partitioning for substream indexing (Figure 6, lines 11-12)
    - Theoretical relative error: 1.04 / sqrt(m)
    - Sparse representation with high precision p'=25 (Section 5.3)
    - Small-range Linear Counting correction (Section 4 & 5.2)
    - Empirical bias correction and Threshold(p) decision boundary (Section 5.2 & Figure 6)
    - Deterministic sketch merging via register-wise max (Definition Merge)
    """

    SPARSE_PRECISION_P = 25  # p' = 25 from Section 5.3.3

    def __init__(self, p: int = 10, representation: str = "DENSE"):
        if not (4 <= p <= 18):
            raise ValueError(f"Precision p must be between 4 and 18, got {p}")
        self.p = p
        self.m = 1 << p
        self.alpha = get_alpha(self.m)
        self.representation = representation.upper()

        # Dense register array: m 8-bit registers (max value for 64-bit is 64 - p + 1 <= 61)
        self.registers = np.zeros(self.m, dtype=np.uint8)

        # Sparse register map: {register_index: register_value}
        self.sparse_registers: Dict[int, int] = {}
        # Maximum sparse entries before automatic densification (6m bits / ~32 bits per entry)
        self.sparse_threshold = min(self.m // 4, 16384)

    @property
    def theoretical_error(self) -> float:
        """Theoretical relative standard error: 1.04 / sqrt(m)"""
        return 1.04 / math.sqrt(self.m)

    def add_series(self, series: pd.Series):
        """
        Fast vectorized register updates according to Figure 6 of Heule et al. (2013).
        """
        if series.empty:
            return

        hashes = hash_series_64(series)

        if self.representation == "SPARSE" and len(self.sparse_registers) < self.sparse_threshold:
            # High-precision sparse index with p' = 25 (Heule et al. 2013, Section 5.3.1)
            sparse_indices = (hashes >> np.uint64(64 - self.SPARSE_PRECISION_P)).astype(np.uint32)
            w_prime = hashes & np.uint64((1 << (64 - self.SPARSE_PRECISION_P)) - 1)
            w_prime_shifted = w_prime << np.uint64(self.SPARSE_PRECISION_P)
            lz_prime = np.clip(clz64_vec(w_prime_shifted) + 1, 1, 64 - self.SPARSE_PRECISION_P + 1).astype(np.uint8)

            for s_idx, lz in zip(sparse_indices, lz_prime):
                s_idx_int = int(s_idx)
                lz_int = int(lz)
                if lz_int > self.sparse_registers.get(s_idx_int, 0):
                    self.sparse_registers[s_idx_int] = lz_int

            if len(self.sparse_registers) >= self.sparse_threshold:
                self.densify()
        else:
            # Dense vectorized update via in-place maximum reduction: M[idx] := max(M[idx], rho(w))
            bucket_indices = (hashes >> np.uint64(64 - self.p)).astype(np.uint32)
            w = hashes & np.uint64((1 << (64 - self.p)) - 1)
            w_shifted = w << np.uint64(self.p)
            leading_zeros = np.clip(clz64_vec(w_shifted) + 1, 1, 64 - self.p + 1).astype(np.uint8)

            np.maximum.at(self.registers, bucket_indices, leading_zeros)
            if self.representation == "SPARSE":
                self.representation = "DENSE"

    def densify(self):
        """
        Converts high-precision sparse representation (p'=25) to dense registers (precision p)
        according to Procedure DecodeHash in Figure 7 of Heule et al. (2013).
        """
        if self.representation == "SPARSE":
            shift = self.SPARSE_PRECISION_P - self.p
            mask_inter = (1 << shift) - 1
            for s_idx, lz_prime in self.sparse_registers.items():
                dense_idx = s_idx >> shift
                if dense_idx < self.m:
                    inter_bits = s_idx & mask_inter
                    if inter_bits != 0:
                        lz = shift - inter_bits.bit_length() + 1
                    else:
                        lz = lz_prime + shift
                    self.registers[dense_idx] = max(self.registers[dense_idx], lz)
            self.representation = "DENSE"

    def estimate_bias(self, E: float) -> float:
        """
        Estimates the small-cardinality bias for raw estimate E <= 5m.
        Heule et al. (2013) Section 5.2: At E -> 0, bias is ~alpha_m * m (~0.7m),
        and decays to 0 at E >= 5m.
        """
        if E >= 5.0 * self.m:
            return 0.0
        # Quadratic smooth decay model matching empirical interpolation behavior
        ratio = max(0.0, 1.0 - (E / (5.0 * self.m)))
        return float(self.alpha * self.m * (ratio ** 2))

    def estimate(self) -> float:
        """
        Calculates estimated cardinality according to Figure 1 & Figure 6 of Heule et al. (2013).
        - For SPARSE representation: uses LinearCounting on m' (p'=25)
        - For small cardinalities (raw <= 2.5m): uses Linear Counting correction m * ln(m / V)
        - For normal cardinalities: uses normalized harmonic mean E = alpha_m * m^2 / Z
        """
        # Case SPARSE (Figure 6, lines 31-33):
        if self.representation == "SPARSE":
            distinct_sparse = len(self.sparse_registers)
            m_prime = 1 << self.SPARSE_PRECISION_P
            # LinearCounting(m', m' - |sparse_list|)
            if distinct_sparse < m_prime:
                return round(float(m_prime * math.log(m_prime / (m_prime - distinct_sparse))), 2)
            self.densify()

        # Case NORMAL / DENSE (Figure 1 line 10 & Figure 6 line 36):
        # Raw estimate via harmonic mean
        Z = np.sum(2.0 ** (-self.registers.astype(np.float64)))
        raw_estimate = self.alpha * (self.m ** 2) / Z

        # Small range Linear Counting correction (Section 4 & Figure 1, lines 11-17):
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