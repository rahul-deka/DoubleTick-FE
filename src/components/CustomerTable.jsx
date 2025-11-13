import { useState, useEffect, useRef, useCallback } from 'react';
import customerDatabase from '../services/customerDatabase';
import { useDebounce } from '../hooks/useDebounce';
import filterIcon from '../assets/test_Filter.svg';
import searchIcon from '../assets/test_Search-3.svg';
import userIcon from '../assets/test_user-3 3.svg';
import searchingDuckGif from '../assets/searching-duck.gif';
import './CustomerTable.css';

const ROWS_PER_PAGE = 30;

const CustomerTable = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const observerTarget = useRef(null);
  const currentOffset = useRef(0);

  const loadMoreCustomers = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      let results;
      let total;

      if (debouncedSearchTerm && sortField) {
        const data = await customerDatabase.searchAndSort(
          debouncedSearchTerm,
          sortField,
          sortOrder,
          currentOffset.current,
          ROWS_PER_PAGE
        );
        results = data.results;
        total = data.total;
      } else if (debouncedSearchTerm) {
        // Search only
        results = await customerDatabase.searchCustomers(
          debouncedSearchTerm,
          currentOffset.current,
          ROWS_PER_PAGE
        );
        total = results.length;
      } else if (sortField) {
        // Sort only
        results = await customerDatabase.getCustomersSorted(
          sortField,
          sortOrder,
          currentOffset.current,
          ROWS_PER_PAGE
        );
      } else {
        // No search or sort
        results = await customerDatabase.getCustomers(
          currentOffset.current,
          ROWS_PER_PAGE
        );
      }

      if (results.length < ROWS_PER_PAGE) {
        setHasMore(false);
      }

      setCustomers(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCustomers = results.filter(c => !existingIds.has(c.id));
        return [...prev, ...newCustomers];
      });
      currentOffset.current += results.length;
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, debouncedSearchTerm, sortField, sortOrder]);

  useEffect(() => {
    setCustomers([]);
    setHasMore(true);
    currentOffset.current = 0;
    setSelectedCustomers(new Set());
    setSelectAll(false);
    loadMoreCustomers();
  }, [debouncedSearchTerm, sortField, sortOrder]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreCustomers();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMoreCustomers]);

  useEffect(() => {
    const fetchCount = async () => {
      const count = await customerDatabase.getCount();
      setTotalCount(count);
    };
    fetchCount();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(customers.map(c => c.id));
      setSelectedCustomers(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectCustomer = (customerId) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
    setSelectAll(newSelected.size === customers.length);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="customer-table-container">
      <div className="top-header">
        <img src="/Doubletick.png" alt="DoubleTick Logo" className="brand-logo" />
        
        <div className="header-controls">
          <div className="search-box">
            <img src={searchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search Customers"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim() === '') {
                  setCustomers([]);
                  setHasMore(true);
                  currentOffset.current = 0;
                  setSelectedCustomers(new Set());
                  setSelectAll(false);
                  loadMoreCustomers();
                }
              }}
              className="search-input"
            />
          </div>

          <div className="filters-container">
            <button
              className="filters-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <img src={filterIcon} alt="Filter" className="filter-icon" />
              Add Filters
            </button>
            {showFilters && (
              <div className="filters-dropdown">
                <div className="filter-option">Filter 1</div>
                <div className="filter-option">Filter 2</div>
                <div className="filter-option">Filter 3</div>
                <div className="filter-option">Filter 4</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">
          <h2>All Customers</h2>
          <span className="count-badge">{totalCount}</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="customer-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input 
                  type="checkbox" 
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                Customer {getSortIndicator('name')}
              </th>
              <th onClick={() => handleSort('age')} className="sortable">
                Age {getSortIndicator('age')}
              </th>
              <th onClick={() => handleSort('email')} className="sortable">
                Email {getSortIndicator('email')}
              </th>
              <th onClick={() => handleSort('lastMessageAt')} className="sortable text-right">
                Last message sent at {getSortIndicator('lastMessageAt')}
              </th>
              <th onClick={() => handleSort('addedBy')} className="sortable text-right">
                Added by {getSortIndicator('addedBy')}
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="checkbox-col">
                  <input 
                    type="checkbox" 
                    checked={selectedCustomers.has(customer.id)}
                    onChange={() => handleSelectCustomer(customer.id)}
                  />
                </td>
                <td>
                  <div className="customer-name">
                    <img
                      src={customer.avatar}
                      alt={customer.name}
                      className="avatar"
                    />
                    <div className="customer-info">
                      <div className="name">{customer.name}</div>
                      <div className="phone">{customer.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="score-col">{customer.age}</td>
                <td>{customer.email}</td>
                <td className="text-right date-col">{formatDate(customer.lastMessageAt)}</td>
                <td className="text-right">
                  <div className="added-by">
                    <img src={userIcon} alt="User" className="icon" />
                    {customer.addedBy}
                  </div>
                </td>
              </tr>
            ))}
            {loading && debouncedSearchTerm && customers.length === 0 && (
              <tr>
                <td colSpan="6" className="searching-message">
                  <img src={searchingDuckGif} alt="Searching" className="searching-duck" />
                  <p>Searching for "{debouncedSearchTerm}"...</p>
                </td>
              </tr>
            )}
            {loading && !debouncedSearchTerm && [...Array(10)].map((_, index) => (
              <tr key={`skeleton-${index}`} className="skeleton-row">
                <td className="checkbox-col">
                  <div className="skeleton skeleton-checkbox"></div>
                </td>
                <td>
                  <div className="customer-name">
                    <div className="skeleton skeleton-avatar"></div>
                    <div className="customer-info">
                      <div className="skeleton skeleton-text skeleton-name"></div>
                      <div className="skeleton skeleton-text skeleton-phone"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="skeleton skeleton-text skeleton-age"></div>
                </td>
                <td>
                  <div className="skeleton skeleton-text skeleton-email"></div>
                </td>
                <td className="text-right">
                  <div className="skeleton skeleton-text skeleton-date"></div>
                </td>
                <td className="text-right">
                  <div className="skeleton skeleton-text skeleton-added"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div ref={observerTarget} className="observer-target"></div>

        {!hasMore && customers.length > 0 && (
          <div className="end-message">
            End of list - {customers.length.toLocaleString()} customers displayed
          </div>
        )}

        {!loading && customers.length === 0 && (
          <div className="no-results">
            {debouncedSearchTerm ? (
              <>
                <p>No customers found matching "{debouncedSearchTerm}"</p>
                <button onClick={() => setSearchTerm('')}>Clear Search</button>
              </>
            ) : (
              <p>No customers available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerTable;
