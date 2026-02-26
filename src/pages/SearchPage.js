// ─────────────────────────────────────────────────────────
// SearchPage.js — Search & Filter Contractors
// URL params: ?q=plumber&category=plumbing&lat=&lng=
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractorAPI } from '../utils/api';
import ContractorCard from '../components/contractor/ContractorCard';
import CompareDrawer from '../components/contractor/CompareDrawer';
import { FiFilter, FiX, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './SearchPage.css';

const SORT_OPTIONS = [
  { value: 'nearest',  labelKey: 'search.sortNearest'  },
  { value: 'rating',   labelKey: 'search.sortRating'   },
  { value: 'price',    labelKey: 'search.sortPrice'    },
];

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── STATE ────────────────────────────────────────────────
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [totalCount, setTotalCount]   = useState(0);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareList, setCompareList] = useState([]); // max 3

  // Filter state — read from URL params
  const [filters, setFilters] = useState({
    q:        searchParams.get('q')        || '',
    category: searchParams.get('category') || '',
    sort:     searchParams.get('sort')     || 'nearest',
    verified: searchParams.get('verified') === 'true',
    featured: searchParams.get('featured') === 'true',
    labour:   searchParams.get('labour')   === 'true',
    lat:      searchParams.get('lat')      || '',
    lng:      searchParams.get('lng')      || '',
  });

  // Search when filters change
  useEffect(() => {
    setPage(1);
    setContractors([]);
    runSearch(filters, 1);
    // Sync filters to URL
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    setSearchParams(params);
  }, [filters]);

  const runSearch = useCallback(async (f, pageNum) => {
    setLoading(true);
    try {
      const data = await contractorAPI.search({
        q:        f.q,
        category: f.category,
        sort:     f.sort,
        verified: f.verified || undefined,
        featured: f.featured || undefined,
        is_labour_group: f.labour || undefined,
        lat:      f.lat,
        lng:      f.lng,
        page:     pageNum,
        limit:    12,
      });
      if (pageNum === 1) {
        setContractors(data.contractors || []);
      } else {
        setContractors(prev => [...prev, ...(data.contractors || [])]);
      }
      setTotalCount(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    runSearch(filters, nextPage);
  }

  // Compare logic — max 3 contractors
  function handleCompare(contractor, checked) {
    if (checked) {
      if (compareList.length >= 3) {
        toast.error('You can compare up to 3 contractors at a time');
        return;
      }
      setCompareList(prev => [...prev, contractor]);
    } else {
      setCompareList(prev => prev.filter(c => c.id !== contractor.id));
    }
  }

  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="search-page page-content container">

      {/* ── PAGE HEADER ── */}
      <div className="search-header">
        <h1 className="search-title">{t('search.title')}</h1>
        {totalCount > 0 && (
          <p className="search-count">
            {totalCount} {t('search.results')}
          </p>
        )}
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="search-bar-row">
        <div className="search-input-wrap">
          <input
            type="text"
            className="input-field"
            placeholder={t('home.searchPlaceholder')}
            value={filters.q}
            onChange={e => updateFilter('q', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runSearch(filters, 1)}
          />
        </div>

        {/* Sort */}
        <select
          className="input-field sort-select"
          value={filters.sort}
          onChange={e => updateFilter('sort', e.target.value)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {t(o.labelKey)}
            </option>
          ))}
        </select>

        {/* Filter toggle (mobile) */}
        <button
          className="btn btn-ghost filter-toggle"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <FiSliders size={16} />
          {t('search.filterBy')}
          {(filters.verified || filters.featured || filters.labour) && (
            <span className="filter-badge" />
          )}
        </button>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className={`filter-chips ${filtersOpen ? 'open' : ''}`}>
        <FilterChip
          label={t('search.filterVerified')}
          active={filters.verified}
          onClick={() => updateFilter('verified', !filters.verified)}
        />
        <FilterChip
          label={t('search.filterFeatured')}
          active={filters.featured}
          onClick={() => updateFilter('featured', !filters.featured)}
        />
        <FilterChip
          label={t('search.filterLabour')}
          active={filters.labour}
          onClick={() => updateFilter('labour', !filters.labour)}
        />
        {/* Clear all filters */}
        {(filters.verified || filters.featured || filters.labour) && (
          <button
            className="chip chip-clear"
            onClick={() => setFilters(prev => ({
              ...prev, verified: false, featured: false, labour: false
            }))}
          >
            <FiX size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* ── RESULTS ── */}
      <div className="search-results">
        {loading && page === 1 ? (
          <div className="search-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton" style={{ height: '380px' }} />
            ))}
          </div>
        ) : contractors.length > 0 ? (
          <>
            <div className="search-grid">
              {contractors.map(c => (
                <ContractorCard
                  key={c.id}
                  contractor={c}
                  showCompare={true}
                  onCompare={handleCompare}
                />
              ))}
            </div>
            {hasMore && (
              <div className="load-more">
                <button
                  className="btn btn-ghost"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? <span className="spinner" /> : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : !loading ? (
          <div className="empty-state">
            <div className="empty-icon">Search</div>
            <h3>{t('search.noResults')}</h3>
            <p>{t('search.noResultsSub')}</p>
            <button
              className="btn btn-outline-cyan"
              onClick={() => setFilters(prev => ({ ...prev, q: '', category: '' }))}
            >
              Clear Search
            </button>
          </div>
        ) : null}
      </div>

      {/* ── COMPARE DRAWER ── */}
      {compareList.length > 0 && (
        <CompareDrawer
          contractors={compareList}
          onRemove={(id) => setCompareList(prev => prev.filter(c => c.id !== id))}
          onClear={() => setCompareList([])}
        />
      )}
    </div>
  );
}

// Small reusable filter chip
function FilterChip({ label, active, onClick }) {
  return (
    <button
      className={`chip ${active ? 'chip-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
