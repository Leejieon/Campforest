import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setIsLoading } from '@store/modalSlice';
import { productList } from '@services/productService';
import ProductCard, { ProductType } from '@components/Product/ProductCard';
import Dropdown from '@components/Public/Dropdown';
import PriceRangeModal from '@components/Product/PriceRangeModal';
import { ReactComponent as RightArrowIcon } from '@assets/icons/arrow-right.svg';

import LocationDetailFilter from '@components/Public/LocationDetailFilter';

import Pagination from '@components/Public/Pagination';

import { ReactComponent as RefreshIcon } from '@assets/icons/refresh.svg';
import { RootState } from '@store/store';

import Swal from 'sweetalert2'

type Option = {
  id: number;
  name: string;
  url?: string;
};

const CATEGORIES: Option[] = [
  { id: 1, name: '분류 전체', url: 'all'},
  { id: 2, name: '텐트', url: 'tent' },
  { id: 3, name: '의자', url: 'chair' },
  { id: 4, name: '침낭/매트', url: 'sleeping' },
  { id: 5, name: '테이블', url: 'table' },
  { id: 6, name: '랜턴', url: 'lantern' },
  { id: 7, name: '코펠/식기', url: 'cookware' },
  { id: 8, name: '안전용품', url: 'safety' },
  { id: 9, name: '버너/화로', url: 'burner' },
  { id: 10, name: '기타', url: 'etc' },
];

type SelecetedLocType = {
  city: string;
  district: string;
  town: string[];
}

type ProductListResponse = {
  products: ProductType[];
  nextCursorId: number | null;
  hasNext: boolean;
  totalCount: number;
}

type FilterCondition = {
  selectedCategory: {id: number; name: string}
  priceRange: (number | null)[]
  selectedLocation: SelecetedLocType | null
}

const ProductList = () => {
  // Redux
  const dispatch = useDispatch();
  const userStore = useSelector((state: RootState) => state.userStore);

  // path 관리
  const params = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [products, setProducts] = useState<ProductType[]>([]);
  // const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [nextPageExist, setNextPageExist] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filterCondition, setFilterCondition] = useState<FilterCondition>({
    selectedCategory: CATEGORIES[0],
    priceRange: [null, null],
    selectedLocation: null
  });

  // 상태 추가
  const [totalElementsCnt, setTotalElementsCnt] = useState(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const maxVisitedPageRef = useRef<number>(0);
  const [isChangeActiveTab, setIsChangeActiveTab] = useState(false);

  // 이벤트 핸들러
  const [isStateReset, setIsStateReset] = useState(false)

  // Refs
  const productCursorRef = useRef<number | null>(null);

  const resetState = async () => {
    setProducts([]);
    setNextPageExist(true);
    productCursorRef.current = null;

    setTotalElementsCnt(0)
    setTotalPages(0)
    setCurrentPage(1)
    maxVisitedPageRef.current = 0
  }

  const resetCategory = () => {
    const matchingCategory = CATEGORIES.find(category => category.url === params.category);
    if (matchingCategory) {
      setFilterCondition(prev => ({
        ...prev,
        selectedCategory: { id: matchingCategory.id, name: matchingCategory.name }
      }));
    } else {
      // 만약 일치하는 카테고리가 없을 경우 기본값 설정 (예: '분류 전체')
      setFilterCondition(prev => ({
        ...prev,
        selectedCategory: { id: 1, name: '분류 전체' }
      }));
    }
  }

  useEffect(() => {
    resetCategory()
  }, [params.category])

  const fetchProducts = useCallback(async (cursor: number | null = null): Promise<ProductListResponse> => {
    try {
      let category: string | null;
      let locations: string | null;
      let minPrice: number | null;
      let maxPrice: number | null;

      if (filterCondition.selectedCategory.name === '침낭/매트') {
        category = '침낭'
      } else if (filterCondition.selectedCategory.name === '코펠/식기') {
        category = '코펠'
      } else if (filterCondition.selectedCategory.name === '버너/화로') {
        category = '버너'
      } else if (filterCondition.selectedCategory.name === '분류 전체') {
        category = null
      } else {
        category = filterCondition.selectedCategory.name
      }

      if (filterCondition.selectedLocation !== null) {
        const { city, district, town } = filterCondition.selectedLocation
        locations = town.map((t) => `${district},${t}`).join('&');
      } else {
        locations = null
      }

      console.log(category, filterCondition.priceRange, filterCondition.selectedCategory, locations)
      console.log(cursor)
      dispatch(setIsLoading(true));
      const result = await productList({
        productType: activeTab === 1 ? 'SALE' : 'RENT',
        cursorId: cursor,
        category: category,
        minPrice: filterCondition.priceRange[0],
        maxPrice: filterCondition.priceRange[1],
        locations: locations,
        size: 10,
      });
      console.log(result)
      dispatch(setIsLoading(false));
      return result;
    } catch (error) {
      dispatch(setIsLoading(false));
      console.error('판매/대여 게시글 불러오기 실패: ', error);
      throw error;
    }
  }, [dispatch, activeTab, filterCondition]);

  const fetchProductsForPage = useCallback(async (targetPage: number) => {
    if (targetPage <= maxVisitedPageRef.current) {
      return;
    }

    let currentCursor = productCursorRef.current;
    let currentPageCount = maxVisitedPageRef.current + 1;

    while (currentPageCount <= targetPage && nextPageExist) {
      const result = await fetchProducts(currentCursor);
      if (result === null) return;
      setProducts(prevProducts => [...prevProducts, ...result.products]);
      console.log(result)
      currentCursor = result.nextCursorId;
      setNextPageExist(result.hasNext);

      if (currentPageCount === 1) {
        const calculatedTotalPages = Math.ceil(result.totalCount / 10);
        setTotalPages(calculatedTotalPages);
        setTotalElementsCnt(result.totalCount)
      }

      currentPageCount++;
    }

    productCursorRef.current = currentCursor;
    maxVisitedPageRef.current = Math.max(maxVisitedPageRef.current, targetPage);
  }, [fetchProducts, nextPageExist]);


  const handlePageChange = useCallback((newPage: number) => {
    console.log(newPage, totalPages, currentPage)
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchProductsForPage(newPage);
  }, [fetchProductsForPage, totalPages, currentPage]);

  const handleTabClick = useCallback((tabIndex: number) => {
    if (tabIndex !== activeTab) {
      setFilterCondition({
        selectedCategory: CATEGORIES[0],
        priceRange: [null, null],
        selectedLocation: null
      })
      setActiveTab(tabIndex);
      setIsChangeActiveTab(true);
    }
  }, [activeTab]);


  useEffect(() => {
    if (isChangeActiveTab) {
      setIsChangeActiveTab(false)
      resetCategory()
    }
  }, [activeTab])

  useEffect(() => {
    resetState()
    setIsStateReset(true)
  }, [filterCondition])

  useEffect(() => {
    if (isStateReset) {
      fetchProductsForPage(1);
      setIsStateReset(false)
    }
  }, [isStateReset]);

  const handleApplyPriceRange = useCallback((min: number | null, max: number | null) => {
    setFilterCondition(prev => ({
      ...prev,
      priceRange: [min, max]
    }))
    setIsModalOpen(false);
  }, []);

  const handleToggle = useCallback((dropdown: string) => {
    setOpenDropdown(prev => prev === dropdown ? null : dropdown);
  }, []);

  const handleSelect = (selected: SelecetedLocType) => {
    setFilterCondition(prev => ({
      ...prev,
      selectedLocation: selected
    }))
    console.log(selected)
  };

  const handleCategorySelect = (option: Option) => {
    navigate(`/product/list/${option.url}`)
  }

  const locationText = filterCondition.selectedLocation === null
    ? '지역 필터'
    : (() => {
        const { city, district, town } = filterCondition.selectedLocation;
        const townStrings = town.map(t => `${district} ${t}`);
        return townStrings.length > 1
          ? `${townStrings[0]} 외 ${townStrings.length - 1}개`
          : townStrings[0];
      })();

  const locationReset = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onToggle
    setFilterCondition(prev => ({
      ...prev,
      selectedLocation: null
    }))
  }

  const PriceFilter = () => {
    const priceRangeText = (() => {
      const [minPrice, maxPrice] = filterCondition.priceRange;
  
      if (minPrice === null && maxPrice === null) {
        return "가격 필터";
      } else if (minPrice === null && maxPrice !== null) {
        return `~ ${maxPrice.toLocaleString()}원`;
      } else if (minPrice !== null && maxPrice === null) {
        return `${minPrice.toLocaleString()}원 ~`;
      } else if (minPrice !== null && maxPrice !== null) {
        return `${minPrice.toLocaleString()}원 ~ ${maxPrice.toLocaleString()}원`;
      }
    })();
  
    return <div>{priceRangeText}</div>;
  }

  const priceReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFilterCondition(prev => ({
      ...prev,
      priceRange: [null, null]
    }))
  }

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

  const moveToProductWrite = () => {
    if (userStore.isLoggedIn) {
      navigate('/product/write')
    } else {
      popLoginAlert()
    }
  }

  return (
    <div className={`flex justify-center min-h-screen lg:mb-[1.5rem]`}>
      <div className={`w-full lg:w-[60rem] xl:w-[66rem] max-lg:p-[1.5rem]`}>
        <div className={`hidden md:flex items-center justify-between lg:mt-[3rem] mb-[2.5rem]`}>
          <div className={`flex font-medium md:text-[1.6rem]`}>
            <p>상품 판매/대여</p>
            <div className='flex items-center ms-[0.75rem]'>
              <RightArrowIcon className='fill-light-black dark:fill-dark-black' />
              <span className='ms-[0.75rem] text-base text-light-signature dark:text-dark-signature'>
                {filterCondition.selectedCategory.name}
              </span>
            </div>
            
          </div>
          <div
            onClick={moveToProductWrite}
            className={`
              px-[0.5rem] py-[0.25rem]
              bg-light-signature text-light-white
              dark:bg-dark-signature dark:text-dark-white
              text-sm cursor-pointer rounded-sm
            `}
          >
            작성하기
          </div>
        </div>

        {/* 탭 */}
        <div className="flex w-full h-[3rem] mb-[2.5rem]">
          {['판매', '대여'].map((tab, index) => (
            <div
              key={tab}
              onClick={() => handleTabClick(index + 1)}
              className={`flex items-center justify-center w-1/2 md:text-lg font-medium cursor-pointer border-b-2 transition-all duration-200 ${
                activeTab === index + 1 ? 'border-light-signature dark:border-dark-signature' : 'border-light-border dark:border-dark-border'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>


        {/* 필터 */}
        <div className="flex flex-wrap gap-[0.5rem] items-center relative z-[10] mb-[0.75rem]">
          <div className='h-[2.25rem]'>
            <Dropdown
              label="카테고리"
              options={CATEGORIES}
              isOpen={openDropdown === 'categories'}
              onToggle={() => handleToggle('categories')}
              onSelect={handleCategorySelect}
              selectedOption={filterCondition.selectedCategory}
            />
          </div>
          <div>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex h-[2.25rem] px-[1rem] py-[0.5rem] border-light-border bg-light-gray dark:border-dark-border dark:bg-dark-gray text-sm font-medium rounded-md border shadow-sm"
            >
              {PriceFilter()}
              <RefreshIcon 
                className={`
                  ${filterCondition.priceRange[0] === null && filterCondition.priceRange[1] === null ? 'hidden' : ''}
                  size-[1.25rem] ms-[0.5rem] -mr-[0.25rem]
                  text-light-text-secondary fill-light-border-icon
                  dark:text-dark-text-secondary dark:fill-dark-border-icon
                `} 
                onClick={e => priceReset(e)} 
              />
            </button>
            <PriceRangeModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onApply={handleApplyPriceRange}
            />
          </div>
          
          <div 
            className={`
              inline-block relative
              text-center
            `}
          >
            <button
              type="button"
              className={`  
                inline-flex justify-between items-center w-full min-w-[4rem] h-[2.25rem] px-[1rem] py-[0.5rem]
                bg-light-gray
                dark:bg-dark-gray
                text-sm font-medium rounded-md shadow-sm`}
              onClick={() => setIsFilterOpen(true)}
            >
              {locationText}

              <RefreshIcon 
                className={`
                  ${filterCondition.selectedLocation === null ? 'hidden' : ''}
                  size-[1.25rem] ms-[0.5rem] -mr-[0.25rem]
                  text-light-text-secondary fill-light-border-icon
                  dark:text-dark-text-secondary dark:fill-dark-border-icon
                `} 
                onClick={e => locationReset(e)} 
              />
            </button>
          </div>

          {/* <Dropdown
            label="지역"
            options={LOCATIONS}
            isOpen={openDropdown === 'locations'}
            onToggle={() => handleToggle('locations')}
            onSelect={setSelectedLocation}
            selectedOption={selectedLocation}
          /> */}

          <LocationDetailFilter 
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onSelect={handleSelect}
            selectedLocation={filterCondition.selectedLocation}
          />
              

          {/* <button
            className={`px-[1rem] py-[0.5rem] text-sm font-medium duration-200 cursor-pointer rounded-md shadow-sm ${
              showAvailableOnly
                ? 'bg-light-signature dark:bg-dark-signature text-light-white'
                : 'bg-light-gray dark:bg-dark-gray text-light-black dark:text-dark-black'
            }`}
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
          >
            거래 가능
          </button> */}
        </div>


        {/* 상품 목록 */}
        <div className="grid lg:grid-cols-5 md:grid-cols-4 grid-cols-2 w-full gap-[1rem]">
          {/* {products.map((product) => (
            <ProductCard 
              key={product.productId} 
              product={product} 
            />
          ))} */}

          {products.slice((currentPage - 1) * 10, currentPage * 10).map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>

        <Pagination
          totalItems={totalElementsCnt}
          itemsPerPage={10}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default ProductList;
