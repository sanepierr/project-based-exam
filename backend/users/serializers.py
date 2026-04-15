from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar_url", "favorite_genres", "country_code", "date_joined"]
        read_only_fields = ["id", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})

        try:
            validate_password(
                data["password"],
                user=User(
                    username=data.get("username"),
                    email=data.get("email"),
                ),
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user
