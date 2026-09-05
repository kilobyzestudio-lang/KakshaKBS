import React, { useState, useEffect } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { KakshaMail, User } from '../../types';
import {
  MessageSquare,
  Send,
  ShieldBan,
  Inbox,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Sparkles,
  UserPlus,
  Search,
  Check,
  Smile,
  Phone,
  Mail,
  User as UserIcon,
  Maximize2,
} from 'lucide-react';

export const KakshaMailInbox: React.FC = () => {
  const {
    currentUser,
    users,
    mails,
    sendKakshaMail,
    markMailAsRead,
    markChatThreadAsRead,
    respondToMailRequest,
    blockUserKakshaId,
  } = useKaksha();

  const [activeTabMode, setActiveTabMode] = useState<'chat' | 'mail'>('chat');
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);

  // Mail folder state (when in mail mode)
  const [activeFilter, setActiveFilter] = useState<'inbox' | 'sent' | 'requests'>('inbox');
  const [selectedMail, setSelectedMail] = useState<KakshaMail | null>(null);

  // Profile Picture Large Lightbox View Modal State
  const [largeAvatarUser, setLargeAvatarUser] = useState<{ name: string; kakshaId: string; role: string; avatarUrl: string; phone: string } | null>(null);

  // Add Contact Modal State
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactSearchInput, setContactSearchInput] = useState('');
  const [addContactError, setAddContactError] = useState('');
  const [addContactSuccess, setAddContactSuccess] = useState('');

  // Compose Mail Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [mailType, setMailType] = useState<KakshaMail['type']>('direct_message');
  const [selectedBatchCode, setSelectedBatchCode] = useState('');

  // Quick Chat message input state
  const [chatInputText, setChatInputText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Saved / Pin contacts state in localStorage
  const [savedContactIds, setSavedContactIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kaksha_saved_contact_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  if (!currentUser) return null;

  // 1. Gather all users who have exchanged messages with current user or are saved as contacts
  const allExchangedUserKakshaIds = new Set<string>();
  mails.forEach((m) => {
    if (m.senderId === currentUser.kakshaId) allExchangedUserKakshaIds.add(m.receiverId);
    if (m.receiverId === currentUser.kakshaId) allExchangedUserKakshaIds.add(m.senderId);
  });

  // Convert Kaksha IDs to User objects
  const contactUsers: User[] = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      (allExchangedUserKakshaIds.has(u.kakshaId) || savedContactIds.includes(u.id))
  );

  // Set default active chat user if none selected
  const activeChatUser = activeChatUserId
    ? users.find((u) => u.id === activeChatUserId) || contactUsers[0]
    : contactUsers[0];

  // Auto-mark chat thread as read when chat user is active
  useEffect(() => {
    if (activeChatUser && activeTabMode === 'chat') {
      markChatThreadAsRead(activeChatUser.kakshaId);
    }
  }, [activeChatUser?.id, activeTabMode, mails]);

  // Auto-mark mail as read when selected
  useEffect(() => {
    if (selectedMail && selectedMail.receiverId === currentUser.kakshaId && selectedMail.status === 'unread') {
      markMailAsRead(selectedMail.id);
    }
  }, [selectedMail?.id]);

  // Get messages for current active chat thread
  const chatThreadMails = activeChatUser
    ? mails
        .filter(
          (m) =>
            (m.senderId === currentUser.kakshaId && m.receiverId === activeChatUser.kakshaId) ||
            (m.senderId === activeChatUser.kakshaId && m.receiverId === currentUser.kakshaId)
        )
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    : [];

  // Mail folder filters
  const myInbox = mails.filter((m) => m.receiverId === currentUser.kakshaId);
  const mySent = mails.filter((m) => m.senderId === currentUser.kakshaId);
  const myRequests = myInbox.filter((m) => m.type === 'join_request');

  const displayMails =
    activeFilter === 'inbox'
      ? myInbox
      : activeFilter === 'sent'
      ? mySent
      : myRequests;

  // Handle Quick Chat Send
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !chatInputText.trim()) return;

    const res = sendKakshaMail(
      activeChatUser.kakshaId,
      'Direct Chat Message',
      chatInputText.trim(),
      'direct_message'
    );

    if (res.success) {
      setChatInputText('');
    } else {
      alert(res.message);
    }
  };

  // Handle Send Official Mail
  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !subject || !body) return;

    const res = sendKakshaMail(targetId, subject, body, mailType, selectedBatchCode);
    if (res.success) {
      setToastMsg(res.message);
      setShowComposeModal(false);
      setTargetId('');
      setSubject('');
      setBody('');
      setTimeout(() => setToastMsg(''), 3000);
    } else {
      alert(res.message);
    }
  };

  // Handle Add Contact by Mobile Number or Kaksha ID
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    setAddContactError('');
    setAddContactSuccess('');

    const cleanInput = contactSearchInput.trim();
    if (!cleanInput) return;

    const upperInput = cleanInput.toUpperCase();
    const digitsOnly = cleanInput.replace(/\D/g, '');

    const foundUser = users.find((u) => {
      if (u.id === currentUser.id) return false;
      if (u.kakshaId.toUpperCase() === upperInput) return true;
      const userDigits = u.phone.replace(/\D/g, '');
      if (digitsOnly.length >= 10 && userDigits.endsWith(digitsOnly.slice(-10))) return true;
      return false;
    });

    if (!foundUser) {
      setAddContactError(`No user found with ID or Mobile Number '${cleanInput}'. Check and try again.`);
      return;
    }

    if (!savedContactIds.includes(foundUser.id)) {
      const updated = [...savedContactIds, foundUser.id];
      setSavedContactIds(updated);
      localStorage.setItem('kaksha_saved_contact_ids', JSON.stringify(updated));
    }

    setActiveChatUserId(foundUser.id);
    setAddContactSuccess(`Added ${foundUser.name} (${foundUser.kakshaId}) to your contacts!`);
    setTimeout(() => {
      setShowAddContactModal(false);
      setContactSearchInput('');
      setAddContactSuccess('');
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-emerald-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar: Switcher between Instant Casual Chat & Formal Kaksha Mail */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            {activeTabMode === 'chat' ? <MessageSquare className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>{activeTabMode === 'chat' ? 'Kaksha Casual Messages' : 'Official Kaksha Mail'}</span>
              <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                Real-Time
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              {activeTabMode === 'chat'
                ? 'Chat casually with friends and teachers. Tap any contact avatar to chat instantly.'
                : 'Send formal notices, batch join requests, or direct structured mail messages.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTabMode('chat')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeTabMode === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Casual Chat</span>
            </button>
            <button
              onClick={() => setActiveTabMode('mail')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeTabMode === 'mail'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Official Mail</span>
            </button>
          </div>

          {activeTabMode === 'chat' ? (
            <button
              onClick={() => setShowAddContactModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-1.5 text-xs whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Friend / Teacher</span>
            </button>
          ) : (
            <button
              onClick={() => setShowComposeModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-1.5 text-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Compose Mail</span>
            </button>
          )}
        </div>
      </div>

      {/* CASUAL MESSAGING TOOL VIEW */}
      {activeTabMode === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[580px]">
          {/* Left Panel: Contact List & Quick Add */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Contacts & Chats</h3>
                <p className="text-[10px] text-slate-400">Tap avatar or name to open chat</p>
              </div>
              <button
                onClick={() => setShowAddContactModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Contacts Scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {contactUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <UserIcon className="w-10 h-10 mx-auto text-slate-300" />
                  <div>
                    <p className="text-xs font-bold text-slate-600">No Contacts Added Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "+ Add Friend / Teacher" above and enter their 10-digit mobile number or Kaksha ID to start chatting!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    className="mt-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    Add Contact Now
                  </button>
                </div>
              ) : (
                contactUsers.map((u) => {
                  const isSelected = activeChatUser?.id === u.id;

                  // Unread messages count from this contact
                  const unreadFromContact = mails.filter(
                    (m) => m.senderId === u.kakshaId && m.receiverId === currentUser.kakshaId && m.status === 'unread'
                  ).length;

                  const lastMsg = mails
                    .filter(
                      (m) =>
                        (m.senderId === currentUser.kakshaId && m.receiverId === u.kakshaId) ||
                        (m.senderId === u.kakshaId && m.receiverId === currentUser.kakshaId)
                    )
                    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

                  return (
                    <div
                      key={u.id}
                      onClick={() => setActiveChatUserId(u.id)}
                      className={`p-3.5 cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-2xs'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Avatar with Large View Trigger */}
                      <div
                        className="relative shrink-0 group cursor-pointer"
                        title="Click to view large profile photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLargeAvatarUser({
                            name: u.name,
                            kakshaId: u.kakshaId,
                            role: u.role,
                            avatarUrl:
                              u.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                            phone: u.phone,
                          });
                        }}
                      >
                        <img
                          src={
                            u.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                          }
                          alt={u.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{u.name}</h4>
                          <div className="flex items-center gap-1.5">
                            {unreadFromContact > 0 && (
                              <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shadow-2xs animate-pulse">
                                {unreadFromContact}
                              </span>
                            )}
                            <span className="text-[9px] font-bold text-slate-400 font-mono">
                              {u.role === 'teacher' ? 'Teacher' : 'Student'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-indigo-600 font-mono font-bold truncate">
                          {u.kakshaId} • {u.phone}
                        </p>
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            unreadFromContact > 0 ? 'font-bold text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {lastMsg ? lastMsg.body : 'Tap to start conversation…'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Chat Thread Window */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
            {activeChatUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      className="relative group cursor-pointer"
                      title="Click to view large profile photo"
                      onClick={() =>
                        setLargeAvatarUser({
                          name: activeChatUser.name,
                          kakshaId: activeChatUser.kakshaId,
                          role: activeChatUser.role,
                          avatarUrl:
                            activeChatUser.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                          phone: activeChatUser.phone,
                        })
                      }
                    >
                      <img
                        src={
                          activeChatUser.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                        }
                        alt={activeChatUser.name}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 group-hover:opacity-90 transition-opacity"
                      />
                    </button>
                    <div>
                      <h3
                        onClick={() =>
                          setLargeAvatarUser({
                            name: activeChatUser.name,
                            kakshaId: activeChatUser.kakshaId,
                            role: activeChatUser.role,
                            avatarUrl:
                              activeChatUser.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                            phone: activeChatUser.phone,
                          })
                        }
                        className="text-sm font-extrabold text-slate-900 leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        {activeChatUser.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-600">{activeChatUser.kakshaId}</span>
                        <span>•</span>
                        <span>{activeChatUser.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => blockUserKakshaId(activeChatUser.kakshaId)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Block User"
                    >
                      <ShieldBan className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Bubbles Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 custom-scrollbar">
                  {chatThreadMails.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                      <MessageSquare className="w-10 h-10 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">No messages yet with {activeChatUser.name}</p>
                      <p className="text-[11px] text-slate-400">Say Hi! Type your message below to begin chatting instantly.</p>
                    </div>
                  ) : (
                    chatThreadMails.map((msg) => {
                      const isMe = msg.senderId === currentUser.kakshaId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.body}</p>
                            <span
                              className={`block text-[9px] mt-1 text-right font-medium ${
                                isMe ? 'text-indigo-200' : 'text-slate-400'
                              }`}
                            >
                              {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Instant Input Bar */}
                <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Write message to ${activeChatUser.name}…`}
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="submit"
                    disabled={!chatInputText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold p-2.5 rounded-2xl shadow-md shadow-indigo-200 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="m-auto text-center text-slate-400 space-y-2 p-6">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Select a contact to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORMAL MAIL VIEW */}
      {activeTabMode === 'mail' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[580px]">
          {/* Folders & Mail List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-3 border-b border-slate-100 flex bg-slate-50 gap-1 text-xs font-bold">
              <button
                onClick={() => setActiveFilter('inbox')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                  activeFilter === 'inbox'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Inbox ({myInbox.length})
              </button>
              <button
                onClick={() => setActiveFilter('requests')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                  activeFilter === 'requests'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Requests ({myRequests.length})
              </button>
              <button
                onClick={() => setActiveFilter('sent')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                  activeFilter === 'sent'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Outbox ({mySent.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {displayMails.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No mail messages in this folder.</p>
                </div>
              ) : (
                displayMails.map((m) => {
                  const isUnread = m.receiverId === currentUser.kakshaId && m.status === 'unread';
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMail(m);
                        if (isUnread) markMailAsRead(m.id);
                      }}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedMail?.id === m.id
                          ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                          : isUnread
                          ? 'bg-indigo-50/30 font-semibold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span className="font-mono text-indigo-600">
                          {activeFilter === 'sent' ? `To: ${m.receiverId}` : `From: ${m.senderId}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Unread" />
                          )}
                          <span>{new Date(m.sentAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <h4 className={`text-xs ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'} truncate`}>
                        {m.subject}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.body}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mail Detail Window */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between h-full">
            {selectedMail ? (
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      ID: {selectedMail.senderId} ({selectedMail.senderRole})
                    </span>
                    <button
                      onClick={() => blockUserKakshaId(selectedMail.senderId)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                    >
                      <ShieldBan className="w-3.5 h-3.5" />
                      <span>Block Kaksha ID</span>
                    </button>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-2">{selectedMail.subject}</h2>
                  <p className="text-xs text-slate-400">
                    Sender: <strong className="text-slate-700">{selectedMail.senderName}</strong> •{' '}
                    {new Date(selectedMail.sentAt).toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {selectedMail.body}
                </div>

                {selectedMail.type === 'join_request' && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Student Batch Join Request</span>
                    </div>
                    <p className="text-xs text-amber-800">
                      Student <strong className="font-mono">{selectedMail.senderId}</strong> requested to join batch code:{' '}
                      <span className="font-mono font-bold text-indigo-700">
                        {selectedMail.batchCode || 'Not specified'}
                      </span>
                    </p>

                    {selectedMail.receiverId === currentUser.kakshaId && (selectedMail.status === 'unread' || selectedMail.status === 'read') && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => respondToMailRequest(selectedMail.id, 'accept')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept & Enroll Student</span>
                        </button>
                        <button
                          onClick={() => respondToMailRequest(selectedMail.id, 'decline')}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                    {selectedMail.status === 'accepted' && (
                      <p className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block">
                        ✓ Request Approved — Student Enrolled
                      </p>
                    )}
                    {selectedMail.status === 'declined' && (
                      <p className="text-xs font-bold text-rose-700 bg-rose-100/80 px-3 py-1.5 rounded-xl border border-rose-200 inline-block">
                        ✗ Request Declined
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="m-auto text-center text-slate-400 space-y-2">
                <Mail className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Select a mail message to view.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LARGE PROFILE PICTURE LIGHTBOX MODAL */}
      {largeAvatarUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center relative border border-slate-200">
            <button
              onClick={() => setLargeAvatarUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-100">
              <img
                src={largeAvatarUser.avatarUrl}
                alt={largeAvatarUser.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{largeAvatarUser.name}</h3>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                {largeAvatarUser.kakshaId} • {largeAvatarUser.role.toUpperCase()}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1">{largeAvatarUser.phone}</p>
            </div>

            <button
              onClick={() => setLargeAvatarUser(null)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-slate-800 transition-colors"
            >
              Close Photo
            </button>
          </div>
        </div>
      )}

      {/* ADD FRIEND / TEACHER CONTACT MODAL */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Add Friend or Teacher</h3>
              </div>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter your friend's or teacher's <strong>10-Digit Mobile Phone Number</strong> or <strong>Kaksha ID</strong>. Once added, their profile picture and name will stay in your contact list for quick casual chatting anytime.
            </p>

            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number or Kaksha ID
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. 9876543210 or KLB-T-4021"
                    value={contactSearchInput}
                    onChange={(e) => setContactSearchInput(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              {addContactError && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {addContactError}
                </p>
              )}

              {addContactSuccess && (
                <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  {addContactSuccess}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add to Contacts</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Official Mail Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Compose Kaksha Mail</h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMail} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Recipient Kaksha ID or Mobile Number</span>
                  <span className="text-[10px] text-indigo-600 font-bold">ID or 10-Digit Mobile</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. KLB-T-4021, KLB-S-9812 or 9876543210"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full tracking-wider font-mono font-bold px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message Type</label>
                  <select
                    value={mailType}
                    onChange={(e) => setMailType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="direct_message">Direct Message</option>
                    <option value="join_request">Batch Join Request</option>
                    <option value="system">Inquiry</option>
                  </select>
                </div>
                {mailType === 'join_request' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. MATH-7XQ2"
                      value={selectedBatchCode}
                      onChange={(e) => setSelectedBatchCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Subject title..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
                <textarea
                  placeholder="Type your message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Mail</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
