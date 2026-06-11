import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/sync/sync_bloc.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SyncBloc, SyncState>(
      builder: (context, state) {
        if (state.isOnline && state.pendingCount == 0) {
          return const SizedBox.shrink();
        }

        final message = !state.isOnline
            ? 'Offline mode — showing cached data'
            : state.isSyncing
                ? 'Syncing ${state.pendingCount} pending changes...'
                : '${state.pendingCount} changes waiting to sync';

        return MaterialBanner(
          content: Text(message),
          leading: Icon(
            state.isOnline ? Icons.sync : Icons.wifi_off,
            color: state.isOnline ? Colors.orange : Colors.red,
          ),
          actions: [
            if (state.isOnline && state.pendingCount > 0)
              TextButton(
                onPressed: () =>
                    context.read<SyncBloc>().add(const SyncNowRequested()),
                child: const Text('Sync now'),
              ),
          ],
        );
      },
    );
  }
}
