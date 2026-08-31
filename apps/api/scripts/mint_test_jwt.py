"""Mints throwaway RS256 credentials for the Postman E2E run: a JWKS for the
API to verify against plus signed JWTs for two fake users. No Clerk involved."""

import json
import sys
import time
import uuid
from pathlib import Path

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa


def main(out_dir: Path) -> None:
    """Write jwks.json, token_a.txt, token_b.txt into out_dir."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    kid = uuid.uuid4().hex

    # Public half in JWKS form — served over HTTP by scripts/postman-test.sh
    # as the stand-in CLERK_JWKS_URL.
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(key.public_key()))
    jwk.update({"kid": kid, "use": "sig", "alg": "RS256"})
    (out_dir / "jwks.json").write_text(json.dumps({"keys": [jwk]}))

    def sign(sub: str, name: str) -> str:
        now = int(time.time())
        claims = {"sub": sub, "name": name, "iat": now, "exp": now + 900}
        return jwt.encode(claims, key, algorithm="RS256", headers={"kid": kid})

    # Two distinct identities so the collection can assert cross-user 404s.
    (out_dir / "token_a.txt").write_text(sign("user_postman_a", "Postman A"))
    (out_dir / "token_b.txt").write_text(sign("user_postman_b", "Postman B"))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
