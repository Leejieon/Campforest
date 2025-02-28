import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '@store/store';
import { setUser, clearUser, SimilarUserType } from '@store/userSlice';

import NavbarTop from './NavbarTop';
import NavbarLeft from './NavbarLeft';
import NavbarLeftExtendRental from './NavbarLeftExtendRental';
import NavbarLeftExtendCommunity from './NavbarLeftExtendCommunity';
import NavbarLeftExtendChatList from './NavbarLeftExtendChat';
import NavbarLeftExtendNotification from './NavbarLeftExtendNotification'
import NavbarLeftExtendSearch from './NavbarLeftExtendSearch'
import NavbarBottom from './NavbarBottom';
import Aside from './Aside';
import { setIsChatOpen } from '@store/chatSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const currentLoc = useLocation();
  const user = useSelector((state: RootState) => state.userStore);
  const chatState = useSelector((state: RootState) => state.chatStore);
  const dispatch = useDispatch();

  // Menu 상태 관리 (메뉴 열기, 닫기)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMenuBlocked, setIsMenuBlocked] = useState<boolean>(false);
  // 확장 Menu 상태 관리 (확장메뉴 열기, 닫기)
  const [isExtendRentalOpen, setIsExtendRentalOpen] = useState<boolean>(false);
  const [isExtendCommunityOpen, setisExtendCommunityOpen] = useState<boolean>(false);
  const [isExtendChatListOpen, setIsExtendChatListOpen] = useState<boolean>(false);
  const [isExtendNotificationOpen, setIsExtendNotificationOpen] = useState<boolean>(false);
  const [isExtendSearchOpen, setIsExtendSearchOpen] = useState<boolean>(false);

  const toggleMenu = (): void => {
    if(isMenuOpen) {
      setIsMenuOpen(false);
    } else {
      setIsMenuBlocked(true);
    }
    setIsExtendRentalOpen(false);
    setisExtendCommunityOpen(false);
    setIsExtendChatListOpen(false);
    setIsExtendNotificationOpen(false);
    setIsExtendSearchOpen(false);
  };

  const closeMenu = (): void => {
    setIsMenuOpen(false)
    setIsExtendRentalOpen(false);
    setisExtendCommunityOpen(false);
    setIsExtendChatListOpen(false);
    setIsExtendNotificationOpen(false);
    setIsExtendSearchOpen(false);
    dispatch(setIsChatOpen(false));
  }

  const toggleExtendMenu = (selectedCategory: string): void => {
    if (selectedCategory === 'rental') {
      if (isExtendRentalOpen) {
        setIsExtendRentalOpen(false)
      } else {
        setisExtendCommunityOpen(false)
        setIsExtendChatListOpen(false)
        setIsExtendNotificationOpen(false)
        setIsExtendSearchOpen(false)
        setIsExtendRentalOpen(true)
        dispatch(setIsChatOpen(false));
      }
    } else if (selectedCategory === 'community') {
      if (isExtendCommunityOpen) {
        setisExtendCommunityOpen(false)
      } else {
        setIsExtendRentalOpen(false)
        setIsExtendChatListOpen(false)
        setIsExtendNotificationOpen(false)
        setIsExtendSearchOpen(false)
        setisExtendCommunityOpen(true)
        dispatch(setIsChatOpen(false));
      }
    } else if (selectedCategory === 'chat') {
      if (isExtendChatListOpen) {
        setIsExtendChatListOpen(false)
        dispatch(setIsChatOpen(false));
      } else {
        setIsExtendRentalOpen(false)
        setisExtendCommunityOpen(false)
        setIsExtendNotificationOpen(false)
        setIsExtendSearchOpen(false)
        setIsExtendChatListOpen(true)
      }
    } else if (selectedCategory === 'notification') {
      if (isExtendNotificationOpen) {
        setIsExtendNotificationOpen(false);
      } else {
        setIsExtendRentalOpen(false)
        setisExtendCommunityOpen(false)
        setIsExtendChatListOpen(false)
        setIsExtendSearchOpen(false)
        setIsExtendNotificationOpen(true)
        dispatch(setIsChatOpen(false));
      }
    } else if (selectedCategory === 'search') {
      if (isExtendSearchOpen) {
        setIsExtendSearchOpen(false);
      } else {
        setIsExtendRentalOpen(false)
        setisExtendCommunityOpen(false)
        setIsExtendChatListOpen(false)
        setIsExtendNotificationOpen(false)
        setIsExtendSearchOpen(true)
        dispatch(setIsChatOpen(false));
      }
    };
  };

  useEffect(() => {
    if(chatState.isChatOpen && !isExtendChatListOpen) {
      toggleExtendMenu('chat');
    }
  }, [chatState.isChatOpen])

  useEffect(() => {
    const isLandingSee = localStorage.getItem("isLandingSee");
    if (isLandingSee === null || isLandingSee === "false") {
      navigate("/Landing");
    }
  }, []);

  useEffect(() => {
    console.log(123)

    // 화면 줄어들면 Menu 강제로 닫기
    const handleAllMenu = () => {
      dispatch(setIsChatOpen(false));
      setIsMenuOpen(false);
      setIsExtendRentalOpen(false);
      setisExtendCommunityOpen(false);
      setIsExtendChatListOpen(false);
      setIsExtendNotificationOpen(false);
      setIsExtendSearchOpen(false);
      setIsMenuBlocked(false);
    };

    const contentBox = document.querySelector('#contentBox') as HTMLElement;
    contentBox.addEventListener('click', closeMenu);
    
    window.addEventListener('resize', handleAllMenu);

    const storedIsLoggedIn = sessionStorage.getItem('isLoggedIn');
    const similarUsersString = sessionStorage.getItem('similarUsers');
    let similarUsers: SimilarUserType[] = [];
    if (similarUsersString) {
      try {
        similarUsers = JSON.parse(similarUsersString);
      } catch (error) {
        console.error('Failed to parse similarUsers: ', error);
      }
    }

    if (storedIsLoggedIn === 'true') {
      const storageObj = {
        userId: Number(sessionStorage.getItem('userId')),
        nickname: sessionStorage.getItem('nickname') || '',
        profileImage: sessionStorage.getItem('profileImage') || '',
        similarUsers: similarUsers || {test: '123'},
      }
      dispatch(setUser(storageObj));
    } else {
      dispatch(clearUser());
    }
  }, []);

  useEffect(() => {
    if (isMenuBlocked) {
      setIsMenuOpen(true);
    }
  }, [isMenuBlocked]);

  const handleTransitionEnd = () => {
    if (!isMenuOpen) {
      setIsMenuBlocked(false);
    }
  };

  return (
    <div>

      {/* 상단 네비게이션바 */}
      <NavbarTop toggleMenu={toggleMenu} closeMenu={closeMenu}/>

      {/* 좌측 메뉴바 */}
      <NavbarLeft 
        isMenuOpen={isMenuOpen} toggleExtendMenu={toggleExtendMenu} user={user} closeMenu={closeMenu}
        toggleMenu={toggleMenu} isExtendRentalOpen={isExtendRentalOpen} isExtendCommunityOpen={isExtendCommunityOpen}
        isExtendChatOpen={isExtendChatListOpen} isExtendNotificationOpen={isExtendNotificationOpen}
        isExtendSearchOpen={isExtendSearchOpen} isMenuBlocked={isMenuBlocked} handleTransitionEnd={handleTransitionEnd}
      />

      {/* 좌측 메뉴바 확장 */}
      <div>
        <NavbarLeftExtendRental isExtendMenuOpen={isExtendRentalOpen} toggleExtendMenu={toggleExtendMenu} closeMenu={closeMenu}/>
        <NavbarLeftExtendCommunity isExtendMenuOpen={isExtendCommunityOpen} toggleExtendMenu={toggleExtendMenu} closeMenu={closeMenu}/>
        <NavbarLeftExtendChatList isExtendMenuOpen={isExtendChatListOpen} toggleExtendMenu={toggleExtendMenu} />
        <NavbarLeftExtendNotification isExtendMenuOpen={isExtendNotificationOpen} toggleExtendMenu={toggleExtendMenu} />
        <NavbarLeftExtendSearch isExtendMenuOpen={isExtendSearchOpen} toggleExtendMenu={toggleExtendMenu} closeMenu={closeMenu}/>
      </div>
      {/* 모바일용 하단 네비게이션바 */}
      <NavbarBottom 
      setIsExtendChatListOpen={setIsExtendChatListOpen}
        toggleMenu={toggleMenu} 
        closeMenu={closeMenu}
      />

      {/* 우측 하단 고정사이드바 */}
      <Aside user={user} />

      {/* 태블릿 이하 사이즈에서 메뉴 열때 배경 회색처리 */}
      <div
        onClick={closeMenu}
        className={`
          ${isMenuOpen ? 'block lg:hidden fixed inset-0 bg-light-black bg-opacity-80' : 'hidden bg-none'}
          z-[120] md:z-[30]
        `}
      >
      </div>
    </div>
  )
}

export default Navbar