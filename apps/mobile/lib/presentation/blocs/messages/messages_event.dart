part of 'messages_bloc.dart';

sealed class MessagesEvent extends Equatable {
  const MessagesEvent();

  @override
  List<Object?> get props => [];
}

class MessagesLoadRequested extends MessagesEvent {
  const MessagesLoadRequested({this.tenantId});

  final String? tenantId;

  @override
  List<Object?> get props => [tenantId];
}

class MessageSendRequested extends MessagesEvent {
  const MessageSendRequested({required this.body, this.tenantId});

  final String body;
  final String? tenantId;

  @override
  List<Object?> get props => [body, tenantId];
}

class UnreadCountRequested extends MessagesEvent {
  const UnreadCountRequested();
}
