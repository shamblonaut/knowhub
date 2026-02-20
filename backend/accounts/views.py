from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User
from .utils import hash_password, verify_password
from .authentication import get_tokens_for_user
from .permissions import IsHOD
from bson import ObjectId


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        required = ['name', 'email', 'password', 'usn', 'semester']
        for field in required:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        if User.objects(email=data['email']).first():
            return Response({"error": "Email already in use."}, status=400)

        if User.objects(usn=data['usn']).first():
            return Response({"error": "USN already registered."}, status=400)

        semester = int(data['semester'])
        if not (1 <= semester <= 6):
            return Response({"error": "Semester must be between 1 and 6."}, status=400)

        user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hash_password(data['password']),
            role='student',
            usn=data['usn'],
            semester=semester,
        )
        user.save()

        return Response({
            "message": "Registration successful.",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "usn": user.usn,
                "semester": user.semester,
            }
        }, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=400)

        user = User.objects(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return Response({"error": "Invalid email or password."}, status=401)

        if not user.is_active:
            return Response({"error": "Account is deactivated."}, status=403)

        tokens = get_tokens_for_user(user)

        return Response({
            **tokens,
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() + "Z",
        }
        if user.role == 'student':
            data['usn'] = user.usn
            data['semester'] = user.semester
        if user.role == 'faculty':
            data['subject_ids'] = [str(sid) for sid in user.subject_ids]
        return Response(data)


class CreateFacultyView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def post(self, request):
        data = request.data
        for field in ['name', 'email', 'password']:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        if User.objects(email=data['email']).first():
            return Response({"error": "Email already in use."}, status=400)

        user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hash_password(data['password']),
            role='faculty',
            subject_ids=[],
        )
        user.save()

        return Response({
            "message": "Faculty account created.",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
        }, status=201)


class ActivateUserView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=ObjectId(user_id))
        except Exception:
            return Response({"error": "User not found."}, status=404)

        is_active = request.data.get('is_active')
        if is_active is None:
            return Response({"error": "'is_active' is required."}, status=400)

        user.is_active = bool(is_active)
        user.save()

        action = "activated" if user.is_active else "deactivated"
        return Response({
            "message": f"User {action}.",
            "user_id": str(user.id),
            "is_active": user.is_active,
        })


class CustomTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError
        
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=400)
            
        try:
            token = RefreshToken(refresh_token)
            
            # Verify user exists in MongoEngine
            user_id = token.get("user_id")
            if not user_id:
                raise TokenError("Token does not contain user_id")
                
            user = User.objects(id=ObjectId(user_id)).first()
            if not user or not user.is_active:
                raise TokenError("User not found or inactive")
                
            # Create a new access token
            return Response({
                "access": str(token.access_token),
                "refresh": str(token)  # Send back the same refresh token, or create a new one based on simplejwt settings
            })
        except TokenError as e:
            return Response({"error": "Token is invalid or expired.", "detail": str(e)}, status=401)
        except Exception as e:
            return Response({"error": "An error occurred.", "detail": str(e)}, status=500)
