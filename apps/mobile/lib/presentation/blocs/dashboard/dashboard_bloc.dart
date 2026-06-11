import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';

part 'dashboard_event.dart';
part 'dashboard_state.dart';

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  DashboardBloc({
    required DashboardRepository dashboardRepository,
    AdminRepository? adminRepository,
  })  : _dashboardRepository = dashboardRepository,
        _adminRepository = adminRepository,
        super(const DashboardInitial()) {
    on<DashboardLoadRequested>(_onLoad);
    on<AdminTenantsLoadRequested>(_onAdminTenants);
  }

  final DashboardRepository _dashboardRepository;
  final AdminRepository? _adminRepository;

  Future<void> _onLoad(
    DashboardLoadRequested event,
    Emitter<DashboardState> emit,
  ) async {
    emit(const DashboardLoading());
    try {
      final summary = event.isAdmin && _adminRepository != null
          ? await _adminRepository.getPlatformDashboard()
          : await _dashboardRepository.getDashboard();
      emit(DashboardLoaded(summary));
    } catch (e) {
      emit(DashboardFailure(e.toString()));
    }
  }

  Future<void> _onAdminTenants(
    AdminTenantsLoadRequested event,
    Emitter<DashboardState> emit,
  ) async {
    if (_adminRepository == null) return;
    emit(const DashboardLoading());
    try {
      final tenants = await _adminRepository.getTenants();
      emit(AdminTenantsLoaded(tenants));
    } catch (e) {
      emit(DashboardFailure(e.toString()));
    }
  }
}
