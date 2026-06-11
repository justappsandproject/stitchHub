import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/messages/messages_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class AdminMessagesPage extends StatefulWidget {
  const AdminMessagesPage({super.key});

  @override
  State<AdminMessagesPage> createState() => _AdminMessagesPageState();
}

class _AdminMessagesPageState extends State<AdminMessagesPage> {
  final _controller = TextEditingController();
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    sl<MessagesBloc>().add(const MessagesLoadRequested());
    sl<MessagesBloc>().add(const UnreadCountRequested());
  }

  void _navigate(int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.adminHome);
      case 1:
        context.go(AppRouter.adminTenants);
      case 2:
        context.go(AppRouter.adminMessages);
      case 3:
        context.go(AppRouter.settings);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<MessagesBloc, MessagesState>(
      bloc: sl<MessagesBloc>(),
      listener: (_, state) {
        if (state is UnreadCountUpdated) setState(() => _unread = state.count);
      },
      child: AdminShell(
        title: 'Platform Messages',
        selectedIndex: 2,
        onNavigate: _navigate,
        unreadMessages: _unread,
        body: BlocBuilder<MessagesBloc, MessagesState>(
          bloc: sl<MessagesBloc>(),
          builder: (context, state) {
            if (state is MessagesLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is MessagesLoaded) {
              return Column(
                children: [
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.messages.length,
                      itemBuilder: (context, index) {
                        final msg = state.messages[index];
                        final fromAdmin = msg.senderRole == UserRole.superAdmin;
                        return Align(
                          alignment:
                              fromAdmin ? Alignment.centerLeft : Alignment.centerRight,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.sizeOf(context).width * 0.75,
                            ),
                            decoration: BoxDecoration(
                              color: fromAdmin
                                  ? Colors.white.withValues(alpha: 0.1)
                                  : const Color(0xFF7C3AED),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  msg.senderName,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.white.withValues(alpha: 0.7),
                                  ),
                                ),
                                Text(msg.body, style: const TextStyle(color: Colors.white)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _controller,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'Message fashion house...',
                                hintStyle: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.5),
                                ),
                              ),
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              if (_controller.text.trim().isEmpty) return;
                              sl<MessagesBloc>().add(
                                MessageSendRequested(
                                  body: _controller.text.trim(),
                                ),
                              );
                              _controller.clear();
                            },
                            icon: const Icon(Icons.send, color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }
            return const Center(
              child: Text('Select a thread', style: TextStyle(color: Colors.white)),
            );
          },
        ),
      ),
    );
  }
}
