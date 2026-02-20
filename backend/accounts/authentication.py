from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from bson import ObjectId


class MongoJWTAuthentication(JWTAuthentication):
    """
    Overrides the default JWTAuthentication to look up users
    from MongoEngine instead of the Django ORM.
    """
    def get_user(self, validated_token):
        from accounts.models import User
        user_id = validated_token.get("user_id")
        if not user_id:
            return None
        try:
            return User.objects.get(id=ObjectId(user_id))
        except Exception:
            return None


def get_tokens_for_user(user):
    """
    Manually creates a JWT token pair with user_id and role
    embedded in the payload.

    Usage:
        tokens = get_tokens_for_user(user)
        tokens['access']   # access token string
        tokens['refresh']  # refresh token string
    """
    token = RefreshToken()
    token["user_id"] = str(user.id)
    token["role"] = user.role
    return {
        "refresh": str(token),
        "access": str(token.access_token),
    }
