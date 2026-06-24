import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/error/exceptions.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/auth/auth_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/messages/messages_bloc.dart';

class SupportPage extends StatefulWidget {
  const SupportPage({super.key});

  @override
  State<SupportPage> createState() => _SupportPageState();
}

class _SupportPageState extends State<SupportPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    final auth = sl<AuthBloc>().state;
    if (auth is AuthAuthenticated && isStaff(auth.user.role)) {
      sl<MessagesBloc>().add(const MessagesLoadRequested());
    }
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthBloc>().state;
    final isStaffUser =
        auth is AuthAuthenticated && isStaff(auth.user.role);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Support'),
        bottom: TabBar(
          controller: _tabs,
          tabs: [
            Tab(
              text: isStaffUser ? 'Chat with StitchHub' : 'Chat',
            ),
            const Tab(text: 'Tickets'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          isStaffUser ? const _StaffChatTab() : const _CustomerChatTab(),
          isStaffUser ? const _StaffTicketsTab() : const _CustomerTicketsTab(),
        ],
      ),
    );
  }
}

class _StaffChatTab extends StatefulWidget {
  const _StaffChatTab();

  @override
  State<_StaffChatTab> createState() => _StaffChatTabState();
}

class _StaffChatTabState extends State<_StaffChatTab> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    sl<MessagesBloc>().add(MessageSendRequested(body: text));
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MessagesBloc, MessagesState>(
      bloc: sl<MessagesBloc>(),
      builder: (context, state) {
        if (state is MessagesLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final messages = state is MessagesLoaded ? state.messages : <dynamic>[];

        return Column(
          children: [
            Expanded(
              child: messages.isEmpty
                  ? const Center(
                      child: Text(
                        'Message StitchHub support about billing, features, or technical issues.',
                        textAlign: TextAlign.center,
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: messages.length,
                      itemBuilder: (context, index) {
                        final msg = messages[index];
                        final fromAdmin = msg.senderRole == UserRole.superAdmin;
                        return Align(
                          alignment: fromAdmin
                              ? Alignment.centerLeft
                              : Alignment.centerRight,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.sizeOf(context).width * 0.75,
                            ),
                            decoration: BoxDecoration(
                              color: fromAdmin
                                  ? Theme.of(context)
                                      .colorScheme
                                      .surfaceContainerHighest
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
                                        : Theme.of(context)
                                            .colorScheme
                                            .onPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: const InputDecoration(
                        hintText: 'Message StitchHub support...',
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  IconButton(
                    onPressed: _send,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _CustomerChatTab extends StatefulWidget {
  const _CustomerChatTab();

  @override
  State<_CustomerChatTab> createState() => _CustomerChatTabState();
}

class _CustomerChatTabState extends State<_CustomerChatTab> {
  final _controller = TextEditingController();
  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  String? _error;
  String? _customerId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final auth = sl<AuthBloc>().state;
    if (auth is! AuthAuthenticated) return;
    final customerId = auth.user.customerId;
    if (customerId == null) {
      setState(() {
        _loading = false;
        _error = 'Customer profile not linked to this account';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _customerId = customerId;
    });

    try {
      final thread =
          await sl<ConversationsRepository>().getThread(customerId);
      setState(() => _messages = thread);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    final customerId = _customerId;
    if (text.isEmpty || customerId == null) return;

    try {
      await sl<ConversationsRepository>().sendMessage(
        customerId: customerId,
        content: text,
      );
      _controller.clear();
      await _load();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: _messages.isEmpty
              ? const Center(
                  child: Text(
                    'Chat with your fashion house about orders, fittings, or style questions.',
                    textAlign: TextAlign.center,
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final msg = _messages[index];
                    final sender = msg['sender'] as Map<String, dynamic>? ?? {};
                    final isStaff = sender['role'] != 'CUSTOMER';
                    final name =
                        '${sender['firstName'] ?? ''} ${sender['lastName'] ?? ''}'
                            .trim();
                    return Align(
                      alignment:
                          isStaff ? Alignment.centerLeft : Alignment.centerRight,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.sizeOf(context).width * 0.75,
                        ),
                        decoration: BoxDecoration(
                          color: isStaff
                              ? Theme.of(context)
                                  .colorScheme
                                  .surfaceContainerHighest
                              : Theme.of(context).colorScheme.primary,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (name.isNotEmpty)
                              Text(
                                name,
                                style: Theme.of(context).textTheme.labelSmall,
                              ),
                            Text(
                              msg['content'] as String? ?? '',
                              style: TextStyle(
                                color: isStaff
                                    ? Theme.of(context).colorScheme.onSurface
                                    : Theme.of(context).colorScheme.onPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: const InputDecoration(
                    hintText: 'Message your fashion house...',
                  ),
                  onSubmitted: (_) => _send(),
                ),
              ),
              IconButton(onPressed: _send, icon: const Icon(Icons.send)),
            ],
          ),
        ),
      ],
    );
  }
}

class _StaffTicketsTab extends StatefulWidget {
  const _StaffTicketsTab();

  @override
  State<_StaffTicketsTab> createState() => _StaffTicketsTabState();
}

class _StaffTicketsTabState extends State<_StaffTicketsTab> {
  List<Map<String, dynamic>> _tickets = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final tickets = await sl<TicketsRepository>().getTickets();
      setState(() => _tickets = tickets);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            const SizedBox(height: 12),
            FilledButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_tickets.isEmpty) {
      return const Center(child: Text('No customer support tickets yet.'));
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tickets.length,
        itemBuilder: (context, index) {
          final ticket = _tickets[index];
          final customer = ticket['customer'] as Map<String, dynamic>? ?? {};
          final name =
              '${customer['firstName'] ?? ''} ${customer['lastName'] ?? ''}'
                  .trim();
          return Card(
            child: ListTile(
              title: Text(ticket['subject'] as String? ?? 'Ticket'),
              subtitle: Text(
                '$name · ${(ticket['status'] as String? ?? '').replaceAll('_', ' ')}',
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => _TicketDetailPage(
                      ticketId: ticket['id'] as String,
                      isStaff: true,
                    ),
                  ),
                );
                await _load();
              },
            ),
          );
        },
      ),
    );
  }
}

class _CustomerTicketsTab extends StatefulWidget {
  const _CustomerTicketsTab();

  @override
  State<_CustomerTicketsTab> createState() => _CustomerTicketsTabState();
}

class _CustomerTicketsTabState extends State<_CustomerTicketsTab> {
  List<Map<String, dynamic>> _tickets = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final tickets = await sl<TicketsRepository>().getTickets();
      setState(() => _tickets = tickets);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _createTicket() async {
    final subjectController = TextEditingController();
    final categoryController = TextEditingController(text: 'General');
    final descriptionController = TextEditingController();
    var saving = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'New support ticket',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: subjectController,
                      decoration: const InputDecoration(labelText: 'Subject'),
                    ),
                    TextField(
                      controller: categoryController,
                      decoration: const InputDecoration(labelText: 'Category'),
                    ),
                    TextField(
                      controller: descriptionController,
                      decoration: const InputDecoration(labelText: 'Description'),
                      maxLines: 4,
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: saving
                          ? null
                          : () async {
                              setSheetState(() => saving = true);
                              try {
                                await sl<TicketsRepository>().createTicket({
                                  'subject': subjectController.text.trim(),
                                  'category': categoryController.text.trim(),
                                  'description':
                                      descriptionController.text.trim(),
                                });
                                if (context.mounted) Navigator.pop(context);
                                await _load();
                              } on ApiException catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(e.message)),
                                  );
                                }
                              } finally {
                                if (context.mounted) {
                                  setSheetState(() => saving = false);
                                }
                              }
                            },
                      child: Text(saving ? 'Submitting...' : 'Submit ticket'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    subjectController.dispose();
    categoryController.dispose();
    descriptionController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        if (_loading)
          const Center(child: CircularProgressIndicator())
        else if (_error != null)
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error!),
                const SizedBox(height: 12),
                FilledButton(onPressed: _load, child: const Text('Retry')),
              ],
            ),
          )
        else if (_tickets.isEmpty)
          const Center(
            child: Text(
              'No tickets yet. Create one to get help from your fashion house.',
              textAlign: TextAlign.center,
            ),
          )
        else
          RefreshIndicator(
            onRefresh: _load,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _tickets.length,
              itemBuilder: (context, index) {
                final ticket = _tickets[index];
                return Card(
                  child: ListTile(
                    title: Text(ticket['subject'] as String? ?? 'Ticket'),
                    subtitle: Text(
                      (ticket['status'] as String? ?? '').replaceAll('_', ' '),
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => _TicketDetailPage(
                            ticketId: ticket['id'] as String,
                            isStaff: false,
                          ),
                        ),
                      );
                      await _load();
                    },
                  ),
                );
              },
            ),
          ),
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton.extended(
            onPressed: _createTicket,
            icon: const Icon(Icons.add),
            label: const Text('New ticket'),
          ),
        ),
      ],
    );
  }
}

class _TicketDetailPage extends StatefulWidget {
  const _TicketDetailPage({
    required this.ticketId,
    required this.isStaff,
  });

  final String ticketId;
  final bool isStaff;

  @override
  State<_TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends State<_TicketDetailPage> {
  Map<String, dynamic>? _ticket;
  final _replyController = TextEditingController();
  bool _loading = true;
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final ticket = await sl<TicketsRepository>().getTicket(widget.ticketId);
      setState(() => _ticket = ticket);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _reply() async {
    final text = _replyController.text.trim();
    if (text.isEmpty) return;

    setState(() => _sending = true);
    try {
      await sl<TicketsRepository>().addReply(widget.ticketId, text);
      _replyController.clear();
      await _load();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _sending = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    try {
      await sl<TicketsRepository>().updateStatus(widget.ticketId, status);
      await _load();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ticket')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ticket == null
              ? Center(child: Text(_error ?? 'Ticket not found'))
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          _error!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _ticket!['subject'] as String? ?? '',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_ticket!['category'] ?? ''} · ${(_ticket!['status'] as String? ?? '').replaceAll('_', ' ')}',
                          ),
                          const SizedBox(height: 8),
                          Text(_ticket!['description'] as String? ?? ''),
                          if (widget.isStaff) ...[
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              children: [
                                for (final status in const [
                                  'OPEN',
                                  'IN_PROGRESS',
                                  'RESOLVED',
                                  'CLOSED',
                                ])
                                  ActionChip(
                                    label: Text(status.replaceAll('_', ' ')),
                                    onPressed: () => _updateStatus(status),
                                  ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount:
                            (_ticket!['replies'] as List<dynamic>? ?? []).length,
                        itemBuilder: (context, index) {
                          final reply = (_ticket!['replies'] as List)[index]
                              as Map<String, dynamic>;
                          final author =
                              reply['author'] as Map<String, dynamic>? ?? {};
                          final name =
                              '${author['firstName'] ?? ''} ${author['lastName'] ?? ''}'
                                  .trim();
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name.isEmpty ? 'Reply' : name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.navy,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(reply['content'] as String? ?? ''),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _replyController,
                              decoration: const InputDecoration(
                                hintText: 'Write a reply...',
                              ),
                              onSubmitted: (_) => _reply(),
                            ),
                          ),
                          IconButton(
                            onPressed: _sending ? null : _reply,
                            icon: _sending
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.send),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}
