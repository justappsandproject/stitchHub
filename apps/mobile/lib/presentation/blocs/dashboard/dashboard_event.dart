part of 'dashboard_bloc.dart';

sealed class DashboardEvent extends Equatable {
  const DashboardEvent();

  @override
  List<Object?> get props => [];
}

class DashboardLoadRequested extends DashboardEvent {
  const DashboardLoadRequested({this.isAdmin = false});

  final bool isAdmin;

  @override
  List<Object?> get props => [isAdmin];
}

class AdminTenantsLoadRequested extends DashboardEvent {
  const AdminTenantsLoadRequested();
}
