import React from 'react'
import { Link, useNavigate } from 'react-router-dom';

import { ReactComponent as HamMenuIcon } from '@assets/icons/ham-menu.svg'
import { ReactComponent as SearchIcon } from '@assets/icons/nav-search.svg'
import { ReactComponent as HomeIcon } from '@assets/icons/home.svg'
import { ReactComponent as ChatIcon } from '@assets/icons/nav-chat.svg'
import { ReactComponent as MyPageIcon } from '@assets/icons/mypage.svg'

import { useSelector } from 'react-redux';
import { RootState } from '@store/store';

import Swal from 'sweetalert2'

type Props = {
  setIsExtendChatListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMenu: () => void;
  closeMenu: () => void;
}

const NavbarBottom = (props: Props) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.userStore);
  
  const popLoginAlert = () => {
    Swal.fire({
      icon: "error",
      title: "로그인 해주세요.",
      text: "로그인 후 사용가능합니다.",
      confirmButtonText: '확인'
    }).then(result => {
      if (result.isConfirmed) {
        navigate('/user/login')
      }
    });
  }

  const clickMyPage = () => {
    if (user.isLoggedIn) {
      navigate(`user/${user.userId}`);
    } else {
      popLoginAlert()
    }
  };

  const handleHomeClick = () => {
    props.closeMenu();
    navigate('/');
  };


  return (
    <div 
      className={`
        flex justify-around md:hidden fixed bottom-[0] z-[30] w-[100%] h-[3.2rem] 
        bg-light-white border-light-border-1
        dark:bg-dark-white dark:border-dark-border-1
        border-t
      `}
    >

      {/* 햄 메뉴 */}
      <div 
        onClick={props.toggleMenu}
        className={`flex flex-all-center w-[3.2rem] cursor-pointer`}
      >
        <HamMenuIcon 
          className={`
            size-[2.1rem]
            stroke-light-black
            dark:stroke-dark-black
          `}
        />
      </div>

      {/* 검색 */}
      <div 
        className={`flex flex-all-center w-[3.2rem] cursor-pointer`}
      >
        <Link to='/search'>
          <SearchIcon 
            className={`
              size-[1.6rem]
              stroke-light-black
              dark:stroke-dark-black
            `}
          />
        </Link>
      </div>  
      
      {/* 홈 */}
      <div
        onClick={handleHomeClick}
        className={`flex flex-all-center w-[3.2rem] cursor-pointer`}
      >
        <Link to='/' onClick={props.closeMenu}>
          <HomeIcon 
            className={`
              size-[1.4rem]
              fill-light-black
              dark:fill-dark-black
            `}
          />
        </Link>
      </div>

      {/* 채팅 */}
      <div 
        className={`flex flex-all-center w-[3.2rem] cursor-pointer`}
        onClick={() => props.setIsExtendChatListOpen(true)}
      >
        <ChatIcon 
          className={`
            size-[1.6rem]
            fill-light-black
            dark:fill-dark-black
          `}
        />
      </div>

      {/* 마이페이지 */}
      <div 
        className={`flex flex-all-center w-[3.2rem] cursor-pointer`}
      >
        <MyPageIcon 
          onClick={clickMyPage}
          className={`
            size-[1.6rem]
            fill-light-black stroke-light-black
            dark:fill-dark-black dark:stroke-dark-black
          `}
        />
      </div>
    </div>
  )
}

export default NavbarBottom