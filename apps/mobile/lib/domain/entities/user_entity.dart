import 'package:equatable/equatable.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';

class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.email,
    required this.role,
    required this.firstName,
    required this.lastName,
    this.tenantId,
    this.fashionHouseName,
    this.customerId,
    this.phone,
    this.photoUrl,
  });

  final String id;
  final String email;
  final UserRole role;
  final String firstName;
  final String lastName;
  final String? tenantId;
  final String? fashionHouseName;
  final String? customerId;
  final String? phone;
  final String? photoUrl;

  String get fullName => '$firstName $lastName'.trim();

  @override
  List<Object?> get props =>
      [id, email, role, firstName, lastName, tenantId, fashionHouseName, phone, photoUrl];
}

class AuthSession extends Equatable {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final UserEntity user;

  @override
  List<Object?> get props => [accessToken, refreshToken, user];
}
