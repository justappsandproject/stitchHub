import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';

part 'messages_event.dart';
part 'messages_state.dart';

class MessagesBloc extends Bloc<MessagesEvent, MessagesState> {
  MessagesBloc(this._repository) : super(const MessagesInitial()) {
    on<MessagesLoadRequested>(_onLoad);
    on<MessageSendRequested>(_onSend);
    on<UnreadCountRequested>(_onUnread);
  }

  final MessagesRepository _repository;

  Future<void> _onLoad(
    MessagesLoadRequested event,
    Emitter<MessagesState> emit,
  ) async {
    emit(const MessagesLoading());
    try {
      if (event.tenantId != null) {
        final messages = await _repository.getAdminThread(event.tenantId!);
        emit(MessagesLoaded(messages, tenantId: event.tenantId));
      } else {
        final messages = await _repository.getInbox();
        emit(MessagesLoaded(messages));
      }
    } catch (e) {
      emit(MessagesFailure(e.toString()));
    }
  }

  Future<void> _onSend(
    MessageSendRequested event,
    Emitter<MessagesState> emit,
  ) async {
    try {
      await _repository.sendMessage(event.body, tenantId: event.tenantId);
      add(MessagesLoadRequested(tenantId: event.tenantId));
      add(const UnreadCountRequested());
    } catch (e) {
      emit(MessagesFailure(e.toString()));
    }
  }

  Future<void> _onUnread(
    UnreadCountRequested event,
    Emitter<MessagesState> emit,
  ) async {
    try {
      final count = await _repository.getUnreadCount();
      emit(UnreadCountUpdated(count));
    } catch (_) {}
  }
}
