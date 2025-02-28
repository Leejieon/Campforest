import React, { useEffect, useRef, useState } from 'react';
import { ReactComponent as LeftIcon } from '@assets/icons/arrow-left.svg';
import noImg from '@assets/images/basic_profile.png'
import { RootState, store } from '@store/store';
import { useDispatch, useSelector } from 'react-redux';
import { communityChatDetail, communityChatList, exitCommunityChat, exitTransactionChat, transactionChatDetail } from '@services/chatService';
import { userPage } from '@services/userService';
import { useWebSocket } from 'Context/WebSocketContext';
import { 
  deleteCommunityChatUser, setChatInProgress, setCommunityChatUserList, 
  setCommunityUnreadCount, setIsChatOpen, setProduct, setSaleStatus, 
  deleteTransactionChatUser 
} from '@store/chatSlice';
import { formatTime } from '@utils/formatTime';
import ProductInfoChat from './ProductInfoChat';
import ChatTradeModal from './ChatTradeModal';
import ChatTradePropser from './ChatTradePropser';
import { productDetail } from '@services/productService';
import TransactionDetail from './TransactionDetail';
import { setOpponentInfo, setTransactionInfo } from '@store/reviewSlice';
import { ChatUserType } from './ChatUser';

type UnifiedMessage = {
  [x: string]: any;
  content: string;
  createdAt: string;
  messageId: number;
  senderId: number;
  read: boolean;
  roomId: number;
  transactionId?: number;
  messageType?: string;
  transactionEntity?: TransactionEntityType | undefined;
};

export type TransactionMessageType = {
  [x: string]: any;
  content: string;
  createdAt: string;
  messageId: number;
  messageType: string;
  read: boolean;
  roomId: number;
  senderId: number;
  transactionId?: number;
};

export type ReviewType = {
  createdAt: string;
  id: number;
  modifiedAt: string;
  productType: string;
  rating: number;
  reviewContent: string;
  reviewImages: string[];
}

export type TransactionEntityType = {
  buyerId: number;
  ownerId: number;
  confirmedByBuyer: boolean;
  confirmedBySeller: boolean;
  createdAt: string;
  fullyConfirmed: boolean;
  id: number;
  meetingPlace: string;
  meetingTime: string;
  modifiedAt: string;
  receiverId: number;
  requesterId: number;
  reviews: ReviewType[];
  saleStatus: string;
  rentStatus: string;
  sellerId: number;
  renterId: number;
  realPrice: number;
  latitude: number;
  longitude: number;
  rentEndDate: string;
  rentStartDate: string;
  deposit: number;
};

export type Message = {
  content?: string;
  createdAt?: string;
  messageId?: number;
  read?: boolean;
  roomId?: number;
  senderId?: number;
  message?: TransactionMessageType;
  messageType?: string;
  transactionEntity?: TransactionEntityType;
};

function unifyMessage(message: Message): UnifiedMessage {
  if ('message' in message && message.message) {
    return {
      content: message.message.content,
      createdAt: message.message.createdAt,
      messageId: message.message.messageId,
      senderId: message.message.senderId,
      read: message.message.read,
      roomId: message.message.roomId,
      transactionId: message.message.transactionId,
      messageType: message.message.messageType,
      transactionEntity: message.transactionEntity,
    };
  } else {
    return {
      content: message.content || '',
      createdAt: message.createdAt || '',
      messageId: message.messageId || 0,
      senderId: message.senderId || 0,
      read: message.read || false,
      roomId: message.roomId || 0,
      messageType: message.messageType,
      transactionEntity: message.transactionEntity,
    };
  }
}

const Chat = () => {
  const { publishMessage } = useWebSocket();
  const dispatch = useDispatch();
  const chatState = useSelector((state: RootState) => state.chatStore);
  const reviewState = useSelector((state: RootState) => state.reviewStore);
  const userId = useSelector((state: RootState) => state.userStore.userId);
  const messages = useSelector((state: RootState) => state.chatStore.chatInProgress) || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('request');
  const [opponentNickname, setOpponentNickname] = useState('');
  const [opponentProfileImage, setOpponentProfileImage] = useState('');
  const [userInput, setUserInput] = useState('');
  const [transactionEntity, setTransactionEntity] = useState<TransactionEntityType>();
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchProduct () {
    const result = await productDetail(chatState.product.productId);
    dispatch(setProduct(result));
  }

  useEffect(() => {
    // 컴포넌트 마운트 시 이벤트 리스너 추가
    window.history.pushState(null, '', window.location.href);
    if(chatState.isChatOpen) {
      window.addEventListener('popstate', handleBackButton);
    } else {
      window.removeEventListener('popstate', handleBackButton);
    }

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [chatState.isChatOpen]);

  function handleBackButton () {
    dispatch(setIsChatOpen(false))
  }

const fetchMessages = async () => {
  try {
    let fetchedMessages;
    if (chatState.chatInProgressType === '일반') {
      fetchedMessages = await communityChatDetail(chatState.roomId);
      dispatch(setChatInProgress(fetchedMessages));
    } else if (chatState.chatInProgressType === '거래') {
      fetchedMessages = await transactionChatDetail(chatState.roomId);
      dispatch(setProduct({ ...chatState.product, productId: fetchedMessages.productId }));
      dispatch(setChatInProgress(fetchedMessages.messages));

      let lastSaleState = '';
      let confirmedCount = 0;

      for (const message of fetchedMessages.messages) {
        if (message.transactionEntity) {
          if (message.transactionEntity.saleStatus) {
            if (message.transactionEntity.saleStatus === 'CONFIRMED') {
              ++confirmedCount;
              if (confirmedCount === 2) {
                lastSaleState = message.transactionEntity.saleStatus;
                dispatch(setOpponentInfo({opponentId: chatState.otherId, opponentNickname: reviewState.opponentNickname}))
                dispatch(setTransactionInfo({
                  ...reviewState,
                  productType: 'SALE',
                  price: message.transactionEntity.realPrice,
                  deposit: 0
                }))
              }
            } else if (message.transactionEntity.saleStatus !== '') {
              lastSaleState = message.transactionEntity.saleStatus;
            }
          } else {
            if (message.transactionEntity.rentStatus === 'CONFIRMED') {
              ++confirmedCount;
              if (confirmedCount === 2) {
                console.log('setTransactionInfo', message.transactionEntity);
                lastSaleState = message.transactionEntity.rentStatus;
                dispatch(setOpponentInfo({...reviewState, opponentId: chatState.otherId}))
                dispatch(setTransactionInfo({
                  ...reviewState,
                  productType: 'RENT',
                  price: message.transactionEntity.realPrice,
                  deposit: message.transactionEntity.deposit
                }))
              }
            } else {
              lastSaleState = message.transactionEntity.rentStatus;
            }
          }
        }
      }

      console.log('lastSaleState', lastSaleState);
      dispatch(setSaleStatus(lastSaleState));
    }
  } catch (error) {
    console.error('Failed to fetch messages:', error);
  }
};


  const opponentInfo = async () => {
    try {
      const result = await userPage(chatState.otherId);
      setOpponentNickname(result.nickname);
      setOpponentProfileImage(result.profileImage);
    } catch (error) {
      console.error('Failed to fetch opponent info:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleExitButton = () => {
    if(chatState.chatInProgressType === '일반') {
      try {
        exitCommunityChat(chatState.roomId);
        dispatch(deleteCommunityChatUser(chatState.roomId));
        dispatch(setIsChatOpen(false));
      } catch (error) {
        console.error('일반 채팅방 나가기 실패 ', error);
      }
    } else {
      try {
        exitTransactionChat(chatState.roomId);
        dispatch(deleteTransactionChatUser(chatState.roomId));
        dispatch(setIsChatOpen(false));
      } catch (error) {
        console.error('거래 채팅방 나가기 실패: ', error);
      }
    }
  }

  useEffect(() => {
    if (chatState.roomId !== 0) {
      opponentInfo();
      fetchMessages();
    }
  }, [chatState.roomId]);
  
  useEffect(() => {
    if(chatState.product.productId !== 0) {
      fetchProduct();
    }
  }, [chatState.product.productId])

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendButton = () => {
    if (userInput.trim() !== '') {
      if (chatState.chatInProgressType === '일반') {
        publishMessage(`/pub/${chatState.roomId}/send`, { senderId: userId, content: userInput });
      } else {
        publishMessage(`/pub/transaction/${chatState.roomId}/send`, {
          senderId: userId,
          content: userInput,
          messageType: 'MESSAGE',
        });
      }
      setUserInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && userInput.trim() !== '') {
      handleSendButton();
    }
  };

  const unifiedMessages = messages.map(unifyMessage);

  return (
    <div
      className={`
        flex flex-col fixed top-0 max-md:w-[100vw] md:w-[35rem] md:max-w-[40rem] h-full pt-[3.2rem] lg:pt-0
        bg-light-white outline-light-border-1
        dark:bg-dark-white dark:outline-dark-border-1
        transition-all duration-300 ease-in-out outline outline-1
      `}
    >
      {/* 모달 */}
      {modalOpen && (
        modalType === 'request' ? (
        <div className={`${modalOpen ? '' : 'hidden'}`}>
          <ChatTradeModal setModalOpen={setModalOpen} />
        </div>
      ) : (
        <div>
          {transactionEntity && 
            (
              <TransactionDetail 
                modalOpen={modalOpen}
                setModalOpen={setModalOpen}
                transactionEntity={transactionEntity}
              />
            )
          }
        </div>
      ))}
      {/* 상대 정보 */}
      <div
        className={`flex items-center shrink-0 h-[3rem] p-[0.8rem]
        border-light-border-1
        dark:border-dark-border-1
        border-b`}
      >
        <div className={`me-[0.75rem] cursor-pointer`} onClick={handleBackButton}>
          <LeftIcon
            className={`md:size-[1.8rem]
            fill-light-border-icon
            dark:fill-dark-border-icon`}
          />
        </div>
        <div className={`text-lg font-medium`}>{opponentNickname}</div>
        <div 
          className='ms-auto text-light-warning dark:text-dark-warning cursor-pointer'
          onClick={() => {
            handleExitButton();
          }}
        >
          채팅방 나가기
        </div>
      </div>
      {/* 상품 정보 */}
      {chatState.chatInProgressType === '거래' && (
        <div>
          <ProductInfoChat 
            opponentNickname={opponentNickname}
            setModalType={setModalType}
            setModalOpen={setModalOpen} 
          />
        </div>
      )}
      {/* 메세지 부분 */}
      <div className="h-full ps-[0.75rem] max-md:pe-[0.75rem] overflow-scroll" ref={scrollRef}>
        {unifiedMessages && unifiedMessages.length > 0 ? (
          unifiedMessages.map((message) =>
            message.senderId === chatState.otherId ? (
              <div
                className={`flex justify-start items-center my-[0.75rem] pe-[20%]`}
                key={message.messageId}
              >
                <div
                  className="border-light-border size-[2.5rem] me-[0.5rem]
                  border rounded-full shadow-md overflow-hidden"
                >
                  <img src={opponentProfileImage ? opponentProfileImage : noImg} alt="NoImg" />
                </div>
                {message.messageType === 'TRANSACTION' ? (
                  <div>
                    <ChatTradePropser 
                      setModalType={setModalType}
                      setModalOpen={setModalOpen}
                      setTransactionEntity={setTransactionEntity}
                      transactionEntity={message.transactionEntity}
                    />
                  </div>
                ) : (
                  <div
                    className="max-w-[10rem] px-[0.8rem] py-[0.3rem]
                  bg-light-gray text-light-text
                  dark:bg-dark-gray dark:text-dark-text
                  rounded-md break-words"
                  >
                    {message.content}
                  </div>
                )}
                <div
                  className="shrink-0 mt-auto mb-[0.125rem] ms-[0.5rem] 
                  text-xs text-end"
                >
                  <div>{formatTime(message.createdAt)}</div>
                </div>
              </div>
            ) : (
              <div
                className={`flex justify-end items-center my-[1rem] ps-[20%]`}
                key={message.messageId}
              >
                <div className="shrink-0 mt-auto me-[0.5rem] text-xs text-end">
                  <div>{message.read ? '' : '1'}</div>
                  <div className="mb-[0.125rem]">{formatTime(message.createdAt)}</div>
                </div>
                {message.messageType === 'TRANSACTION' ? (
                  <div>
                    <ChatTradePropser 
                      setModalType={setModalType}
                      setModalOpen={setModalOpen}
                      setTransactionEntity={setTransactionEntity}
                      transactionEntity={message.transactionEntity}
                    />
                  </div>
                ) : (
                <div
                  className="max-w-[10rem] px-[0.8rem] py-[0.3rem]
                  bg-light-signature text-light-text
                  dark:bg-dark-signature dark:text-dark-text
                  rounded-md break-words"
                >
                  {message.content}
                </div>
                )}
              </div>
            ),
          )
        ) : (
          <div></div>
        )}
      </div>

      <div
        className="flex justify-between items-center shrink-0 w-full h-[3.5rem] px-[1rem] 
        bg-light-gray
        dark:bg-dark-gray
        border-t"
      >
        <input
          className="w-[90%] bg-transparent focus:outline-none"
          placeholder="대화내용을 입력하세요."
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
          onKeyDown={handleKeyPress}
        />
        <div
          className="text-center font-medium
          hover:text-light-signature
          dark:hover:text-dark-signature
          duration-150 cursor-pointer"
          onClick={handleSendButton}
        >
          전송
        </div>
      </div>
    </div>
  );
};

export default Chat;
