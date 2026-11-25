
import {
  Component,
  OnInit,
  AfterViewChecked,
  ElementRef,
  ViewChild
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import {
  CommunicationService,
  Conversation,
  ChatMessage
} from '../../services/communication.service';

import { UserResponseDTO } from '../../services/user.service';

type ChatFilter = 'ALL' | 'UNREAD';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesArea')
  private messagesArea?: ElementRef<HTMLDivElement>;

  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];

  messages: ChatMessage[] = [];

  selectedConversation: Conversation | null = null;

  newMessage = '';

  loadingConversations = false;
  loadingMessages = false;
  loadingOlderMessages = false;
  sendingMessage = false;

  hasMoreMessages = true;

  errorMessage = '';

  showNewChat = false;

  availableUsers: UserResponseDTO[] = [];
  filteredUsers: UserResponseDTO[] = [];

  selectedUserId: number | null = null;

  searchUser = '';
  searchConversation = '';

  loadingUsers = false;

  activeFilter: ChatFilter = 'ALL';

  currentUserId = Number(
    localStorage.getItem('crm_user_id') ||
    localStorage.getItem('userId') ||
    0
  );

  private readonly messagePageSize = 30;

  private shouldScrollToBottom = false;

  constructor(
    private communicationService: CommunicationService
  ) {}

  ngOnInit(): void {

    if (!this.currentUserId) {
      this.errorMessage = 'Unable to identify logged-in user.';
      return;
    }

    this.loadConversations();
  }

  ngAfterViewChecked(): void {

    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // =====================================
  // LOAD CONVERSATIONS
  // =====================================

  loadConversations(): void {

    this.loadingConversations = true;
    this.errorMessage = '';

    this.communicationService.getMyConversations().subscribe({

      next: (response: Conversation[]) => {

        this.conversations = response || [];

        this.applyConversationFilters();

        this.loadingConversations = false;
      },

      error: (error: HttpErrorResponse) => {

        console.error('Conversation loading error:', error);

        this.errorMessage = 'Unable to load conversations.';

        this.loadingConversations = false;
      }
    });
  }

  // =====================================
  // SEARCH AND FILTER CONVERSATIONS
  // =====================================

  filterConversations(): void {
    this.applyConversationFilters();
  }

  setChatFilter(filter: ChatFilter): void {

    this.activeFilter = filter;

    this.applyConversationFilters();
  }

  applyConversationFilters(): void {

    const search = this.searchConversation
      .toLowerCase()
      .trim();

    this.filteredConversations = this.conversations.filter(
      conversation => {

        const matchesSearch =
          (conversation.participantName || '')
            .toLowerCase()
            .includes(search) ||
          (conversation.participantRole || '')
            .toLowerCase()
            .includes(search) ||
          (conversation.lastMessage || '')
            .toLowerCase()
            .includes(search);

        const matchesFilter =
          this.activeFilter === 'ALL' ||
          conversation.unreadCount > 0;

        return matchesSearch && matchesFilter;
      }
    );
  }

  get totalUnreadCount(): number {

    return this.conversations.reduce(
      (total, conversation) =>
        total + conversation.unreadCount,
      0
    );
  }

  // =====================================
  // NEW CHAT
  // =====================================

  openNewChat(): void {

    this.showNewChat = true;

    this.selectedUserId = null;

    this.searchUser = '';

    this.loadAvailableUsers();
  }

  closeNewChat(): void {

    this.showNewChat = false;

    this.selectedUserId = null;

    this.searchUser = '';
  }

  loadAvailableUsers(): void {

    this.loadingUsers = true;

    this.errorMessage = '';

    this.communicationService.getAvailableUsers().subscribe({

      next: (users: UserResponseDTO[]) => {

        this.availableUsers = (users || []).filter(
          user =>
            user.status === 'ACTIVE' &&
            user.id !== this.currentUserId
        );

        this.filteredUsers = [...this.availableUsers];

        this.loadingUsers = false;

        console.log('Available chat users:', this.availableUsers);
      },

      error: (error: HttpErrorResponse) => {

        console.error('Available users error:', error);

        this.errorMessage = 'Unable to load available users.';

        this.loadingUsers = false;
      }
    });
  }

  // =====================================
  // SEARCH AVAILABLE USERS
  // =====================================

  filterUsers(): void {

    const search = this.searchUser
      .toLowerCase()
      .trim();

    this.filteredUsers = this.availableUsers.filter(user => {

      const fullName =
        `${user.firstName || ''} ${user.lastName || ''}`
          .toLowerCase()
          .trim();

      return (
        fullName.includes(search) ||
        (user.email || '').toLowerCase().includes(search) ||
        String(user.role || '').toLowerCase().includes(search)
      );
    });
  }

  // =====================================
  // SELECT USER FOR NEW CHAT
  // =====================================

  selectNewChatUser(user: UserResponseDTO): void {

    this.selectedUserId = user.id;

    this.closeNewChat();

    const existingConversation = this.conversations.find(
      conversation =>
        conversation.participantId === user.id
    );

    if (existingConversation) {

      this.openConversation(existingConversation);

      return;
    }

    // First actual message will create the conversation.

    this.selectedConversation = {

      id: 0,

      participantId: user.id,

      participantName:
        `${user.firstName || ''} ${user.lastName || ''}`.trim(),

      participantRole: String(user.role),

      lastMessage: '',

      lastMessageAt: '',

      unreadCount: 0
    };

    this.messages = [];

    this.newMessage = '';

    this.hasMoreMessages = false;

    this.shouldScrollToBottom = true;
  }

  // =====================================
  // OPEN EXISTING CONVERSATION
  // =====================================

  openConversation(conversation: Conversation): void {

    this.selectedConversation = conversation;

    this.messages = [];

    this.newMessage = '';

    this.hasMoreMessages = true;

    this.closeNewChat();

    this.loadMessages(conversation);
  }

  // =====================================
  // LOAD LATEST 30 MESSAGES
  // =====================================

  loadMessages(conversation: Conversation): void {

    this.loadingMessages = true;

    this.communicationService
      .getMessages(conversation.id)
      .subscribe({

        next: (response: ChatMessage[]) => {

          this.messages = response || [];

          this.hasMoreMessages =
            this.messages.length === this.messagePageSize;

          this.loadingMessages = false;

          this.shouldScrollToBottom = true;

          this.markConversationAsRead(conversation);
        },

        error: (error: HttpErrorResponse) => {

          console.error('Message loading error:', error);

          this.loadingMessages = false;

          this.errorMessage = 'Unable to load messages.';
        }
      });
  }

  // =====================================
  // LOAD OLDER MESSAGES
  // =====================================

  loadOlderMessages(): void {

    if (
      !this.selectedConversation ||
      this.selectedConversation.id === 0 ||
      this.loadingOlderMessages ||
      !this.hasMoreMessages ||
      this.messages.length === 0
    ) {
      return;
    }

    this.loadingOlderMessages = true;

    const firstMessageId = this.messages[0].id;

    const previousScrollHeight =
      this.messagesArea?.nativeElement.scrollHeight || 0;

    this.communicationService
      .getOlderMessages(
        this.selectedConversation.id,
        firstMessageId
      )
      .subscribe({

        next: (olderMessages: ChatMessage[]) => {

          if (olderMessages.length > 0) {

            this.messages = [
              ...olderMessages,
              ...this.messages
            ];
          }

          this.hasMoreMessages =
            olderMessages.length === this.messagePageSize;

          this.loadingOlderMessages = false;

          setTimeout(() => {

            const element =
              this.messagesArea?.nativeElement;

            if (element) {

              element.scrollTop =
                element.scrollHeight - previousScrollHeight;
            }

          });
        },

        error: (error: HttpErrorResponse) => {

          console.error('Older messages error:', error);

          this.loadingOlderMessages = false;
        }
      });
  }

  // =====================================
  // MARK AS READ
  // =====================================

  markConversationAsRead(
    conversation: Conversation
  ): void {

    if (conversation.id === 0) {
      return;
    }

    this.communicationService
      .markMessagesAsRead(conversation.id)
      .subscribe({

        next: () => {

          conversation.unreadCount = 0;

          this.applyConversationFilters();
        },

        error: (error: HttpErrorResponse) => {

          console.error('Mark as read error:', error);
        }
      });
  }

  // =====================================
  // SEND MESSAGE
  // =====================================

  sendMessage(): void {

    const message = this.newMessage.trim();

    if (
      !message ||
      !this.selectedConversation ||
      this.sendingMessage
    ) {
      return;
    }

    this.sendingMessage = true;

    this.errorMessage = '';

    const receiverId =
      this.selectedConversation.participantId;

    this.communicationService.sendMessage({

      receiverId,

      message

    }).subscribe({

      next: (response: ChatMessage) => {

        const alreadyExists = this.messages.some(
          item => item.id === response.id
        );

        if (!alreadyExists) {
          this.messages.push(response);
        }

        this.newMessage = '';

        this.sendingMessage = false;

        this.shouldScrollToBottom = true;

        this.updateConversationAfterSend(response);

        this.loadConversations();
      },

      error: (error: HttpErrorResponse) => {

        console.error('Send message error:', error);

        this.errorMessage = 'Unable to send message.';

        this.sendingMessage = false;
      }
    });
  }

  // =====================================
  // ENTER KEY HANDLING
  // =====================================

  handleMessageKeydown(event: KeyboardEvent): void {

    if (event.key === 'Enter' && !event.shiftKey) {

      event.preventDefault();

      this.sendMessage();
    }
  }

  // =====================================
  // UPDATE CONVERSATION AFTER SEND
  // =====================================

  updateConversationAfterSend(
    response: ChatMessage
  ): void {

    if (!this.selectedConversation) {
      return;
    }

    this.selectedConversation.id = response.conversationId;

    this.selectedConversation.lastMessage =
      response.message;

    this.selectedConversation.lastMessageAt =
      response.sentAt;

    const existingIndex = this.conversations.findIndex(
      conversation =>
        conversation.participantId === response.receiverId
    );

    if (existingIndex >= 0) {

      this.conversations[existingIndex] =
        this.selectedConversation;

    } else {

      this.conversations.unshift(
        this.selectedConversation
      );
    }

    this.applyConversationFilters();
  }

  // =====================================
  // MESSAGE HELPERS
  // =====================================

  isMyMessage(message: ChatMessage): boolean {

    return message.senderId === this.currentUserId;
  }

  getMessageDateLabel(dateValue: string): string {

    const messageDate = new Date(dateValue);

    const today = new Date();

    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (
      messageDate.toDateString() === today.toDateString()
    ) {
      return 'Today';
    }

    if (
      messageDate.toDateString() === yesterday.toDateString()
    ) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString();
  }

  isFirstMessageOfDay(index: number): boolean {

    if (index === 0) {
      return true;
    }

    const currentDate =
      new Date(this.messages[index].sentAt).toDateString();

    const previousDate =
      new Date(this.messages[index - 1].sentAt).toDateString();

    return currentDate !== previousDate;
  }

  // =====================================
  // AUTO SCROLL
  // =====================================

  private scrollToBottom(): void {

    const element = this.messagesArea?.nativeElement;

    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

}
