part of 'messages_bloc.dart';

sealed class MessagesState extends Equatable {
  const MessagesState();

  @override
  List<Object?> get props => [];
}

class MessagesInitial extends MessagesState {
  const MessagesInitial();
}

class MessagesLoading extends MessagesState {
  const MessagesLoading();
}

class MessagesLoaded extends MessagesState {
  const MessagesLoaded(this.messages, {this.tenantId});

  final List<MessageEntity> messages;
  final String? tenantId;

  @override
  List<Object?> get props => [messages, tenantId];
}

class UnreadCountUpdated extends MessagesState {
  const UnreadCountUpdated(this.count);

  final int count;

  @override
  List<Object?> get props => [count];
}

class MessagesFailure extends MessagesState {
  const MessagesFailure(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}
