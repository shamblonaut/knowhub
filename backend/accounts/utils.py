import bcrypt


def hash_password(plain: str) -> str:
    # bcrypt limits passwords to 72 bytes
    truncated = plain.encode('utf-8')[:72]
    # hashpw returns bytes, we decode to store as string
    hashed = bcrypt.hashpw(truncated, bcrypt.gensalt())
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    truncated = plain.encode('utf-8')[:72]
    # checkpw expects bytes for both arguments
    return bcrypt.checkpw(truncated, hashed.encode('utf-8'))
