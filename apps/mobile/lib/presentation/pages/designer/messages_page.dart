import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/messages/messages_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class MessagesPage extends StatefulWidget {
  const MessagesPage({super.key});

  @override
  State<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage> {
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    sl<MessagesBloc>().add(const MessagesLoadRequested());
  }

  void _navigate(int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.designerHome);
      case 1:
        context.go(AppRouter.designerOrders);
      case 2:
        context.go(AppRouter.designerMessages);
      case 3:
        context.go(AppRouter.designerCustomers);
      case 4:
        context.go(AppRouter.designerMore);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DesignerShell(
      title: 'Support Messages',
      selectedIndex: 2,
      onNavigate: _navigate,
      unreadMessages: 0,
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
                                ? Theme.of(context).colorScheme.surfaceContainerHighest
                                : Theme.of(context).colorScheme.primary,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                msg.senderName,
                                style: Theme.of(context).textTheme.labelSmall,
                              ),
                              Text(
                                msg.body,
                                style: TextStyle(
                                  color: fromAdmin
                                      ? Theme.of(context).colorScheme.onSurface
                                      : Theme.of(context).colorScheme.onPrimary,
                                ),
                              ),
                              if (msg.isUnread)
                                const Padding(
                                  padding: EdgeInsets.only(top: 4),
                                  child: Text(
                                    'NEW',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.redAccent,
                                    ),
                                  ),
                                ),
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
                            decoration: const InputDecoration(
                              hintText: 'Message StitchHub support...',
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            if (_controller.text.trim().isEmpty) return;
                            sl<MessagesBloc>().add(
                              MessageSendRequested(body: _controller.text.trim()),
                            );
                            _controller.clear();
                          },
                          icon: const Icon(Icons.send),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }
          return const Center(child: Text('No messages yet'));
        },
      ),
    );
  }
}
