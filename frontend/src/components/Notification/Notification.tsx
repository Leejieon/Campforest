import React from 'react';
import userImage from '@assets/images/basic_profile.png'
import { NotificationType } from '@store/notificationSlice';
import { formatTime } from '@utils/formatTime';
import { useNavigate } from 'react-router-dom';
import FollowBtn from '@components/User/FollowBtn';

type Props = {
  notification: NotificationType;
}

const Notification = ({notification}: Props) => {
  const navigate = useNavigate();

  const renderNotificationContent = () => {
    switch(notification.notificationType) {
      case 'FOLLOW':
        return (
          <div className={`flex w-full items-center`}>
            <div className={`w-[70%] px-[0.5rem] text-sm`}>
              <span className={`font-bold`}>
                {notification.senderNickname}
              </span>
              <span>
                님이 회원님을 팔로우하기 시작했습니다.
              </span>
              <span className={`ms-[0.75rem] text-light-text-secondary dark:text-dark-text-secondary text-xs`}>
                {formatTime(notification.createdAt)}
              </span>
            </div>
            <div className='w-[30%] text-sm text-center'>
              <FollowBtn targetUserId={notification.senderId}/>
            </div>
          </div>
        );
      case 'LIKE':
        return (
          <div className={`flex w-full items-center`}>
            <div className={`col-span-4 px-[0.5rem] text-sm`}>
              <span className={`font-bold`}>
                {notification.senderNickname}
              </span>
              <span>
                님이 회원님의 게시글을 좋아합니다.
              </span>
              <span className={`ms-[0.5rem] text-light-text-secondary dark:text-dark-text-secondary text-xs`}>
                {formatTime(notification.createdAt)}
              </span>
            </div>
          </div>
        );
        case 'COMMENT':
          return (
            <div className={`flex w-full items-center`}>
            <div className={`col-span-4 px-[0.5rem] text-sm`}>
              <span className={`font-bold`}>
                {notification.senderNickname}
              </span>
              <span>
                님이 회원님의 게시물에 댓글을 남겼습니다.
              </span>
              <span className={`ms-[0.5rem] text-light-text-secondary dark:text-dark-text-secondary text-xs`}>
                {formatTime(notification.createdAt)}
              </span>
            </div>
          </div>
        )
      default:
        return <div className={`flex w-full items-center`}>
        <div className={`col-span-4 px-[0.5rem] text-sm`}>
          <span className={`font-bold`}>
            {notification.senderNickname}
          </span>
          <span>
            {notification.message}
          </span>
          <span className={`ms-[0.5rem] text-light-text-secondary dark:text-dark-text-secondary text-xs`}>
            {formatTime(notification.createdAt)}
          </span>
        </div>  
      </div>
    }
  };

  return (
    <div 
      className={`
        flex items-center px-[0.5rem] py-[0.75rem]
      bg-light-white border-light-border dark:bg-dark-white dark:border-dark-border 
        border-b overflow-hidden
      `}
    >
      {/* 사용자 이미지 */}
      <div className={`shrink-0 size-[2.5rem] rounded-full border overflow-hidden`}>
        <img 
          src={notification.senderProfileImage || userImage} 
          alt="User" 
          className={`fit cursor-pointer`}
          onClick={() => {
           navigate(`/user/${notification.senderId}`) 
          }}
        />
      </div>

      {renderNotificationContent()}
    </div>
  )
}

export default Notification;