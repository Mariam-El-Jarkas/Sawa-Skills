"""
Pure-Python TF-IDF cosine similarity — no scikit-learn, no numpy.
Works on any Python version (3.8+).
"""

import math
import re
from collections import Counter
from typing import List, Dict


# ── Tokenizer ────────────────────────────────────────────────────────────────

def _tokenize(text: str) -> List[str]:
    """Lowercase, strip punctuation, split on whitespace."""
    return re.findall(r"[a-z0-9]+", text.lower())


# ── TF-IDF helpers ────────────────────────────────────────────────────────────

def _tfidf_vector(doc_tokens: List[str], df: Counter, n_docs: int) -> Dict[str, float]:
    """Return a TF-IDF dict for one document given corpus document-frequencies."""
    tf = Counter(doc_tokens)
    total = len(doc_tokens) or 1
    vec: Dict[str, float] = {}
    for term, count in tf.items():
        tf_score = count / total
        # Smoothed IDF so terms absent from the query still get a score
        idf_score = math.log((n_docs + 1) / (df[term] + 1)) + 1.0
        vec[term] = tf_score * idf_score
    return vec


def _cosine(v1: Dict[str, float], v2: Dict[str, float]) -> float:
    common = set(v1) & set(v2)
    if not common:
        return 0.0
    dot = sum(v1[t] * v2[t] for t in common)
    mag1 = math.sqrt(sum(x * x for x in v1.values()))
    mag2 = math.sqrt(sum(x * x for x in v2.values()))
    if mag1 == 0.0 or mag2 == 0.0:
        return 0.0
    return dot / (mag1 * mag2)


# ── Matcher ───────────────────────────────────────────────────────────────────

class SkillPostMatcher:
    def __init__(self, score_threshold: float = 0.05, max_results: int = 10):
        self.score_threshold = score_threshold
        self.max_results = max_results

    def score_posts(self, skills: List[str], posts: List[Dict]) -> List[Dict]:
        """
        Given a skill list and post dicts {id, content},
        return [{id, score}] sorted by descending relevance.
        Only entries above score_threshold are included.
        """
        if not skills or not posts:
            return []

        skill_query = " ".join(skills)
        post_contents = [str(p.get("content") or "") for p in posts]
        all_texts = [skill_query] + post_contents

        # Tokenise
        tokenised = [_tokenize(t) for t in all_texts]

        # Document frequencies across the whole corpus
        df: Counter = Counter()
        for tokens in tokenised:
            df.update(set(tokens))

        n_docs = len(tokenised)

        # Build vectors
        vectors = [_tfidf_vector(tokens, df, n_docs) for tokens in tokenised]
        query_vec = vectors[0]
        post_vecs = vectors[1:]

        results = []
        for post, vec in zip(posts, post_vecs):
            score = _cosine(query_vec, vec)
            if score >= self.score_threshold:
                results.append({"id": post["id"], "score": score})

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[: self.max_results]

    def find_matching_skill(self, post_content: str, skills: List[str]) -> List[str]:
        """Return which skills from the list appear as substrings in the content."""
        content_lower = post_content.lower()
        return [s for s in skills if s.lower() in content_lower]
