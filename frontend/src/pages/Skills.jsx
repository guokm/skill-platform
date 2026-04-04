import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Filter, Search, TrendingUp, Clock, RefreshCcw } from 'lucide-react'
import SkillCard from '../components/SkillCard'
import { categoriesApi, skillsApi } from '../services/api'

const SORT_OPTIONS = [
  { value: 'popular', label: '最热', icon: TrendingUp },
  { value: 'downloads', label: '下载最多', icon: Download },
  { value: 'newest', label: '最新入库', icon: Clock },
  { value: 'updated', label: '最近更新', icon: RefreshCcw },
]

const DEBOUNCE_DELAY = 350

export default function Skills() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [skills, setSkills] = useState([])
  const [categoryGroups, setCategoryGroups] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(searchParams.get('keyword') ?? '')

  const keyword = searchParams.get('keyword') ?? ''
  const categorySlug = searchParams.get('category') ?? ''
  const legacyCategoryId = searchParams.get('categoryId') ?? ''
  const sortBy = searchParams.get('sortBy') ?? 'popular'
  const page = Number.parseInt(searchParams.get('page') ?? '0', 10)

  const categories = useMemo(
    () => categoryGroups.flatMap((group) => group.categories ?? []),
    [categoryGroups],
  )

  const currentCategory = categories.find((category) => (
    category.slug === categorySlug || `${category.id}` === legacyCategoryId
  ))

  useEffect(() => {
    setSearchInput(keyword)
  }, [keyword])

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await categoriesApi.grouped()
        setCategoryGroups(response.data)
      } catch (error) {
        console.error('Failed to load categories', error)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    async function loadSkills() {
      setLoading(true)
      try {
        const response = await skillsApi.list({
          keyword: keyword || undefined,
          category: categorySlug || undefined,
          categoryId: legacyCategoryId || undefined,
          sortBy,
          page,
          size: 12,
        })
        setSkills(response.data.content)
        setPagination(response.data)
      } catch (error) {
        console.error('Failed to load skills', error)
      } finally {
        setLoading(false)
      }
    }

    loadSkills()
  }, [categorySlug, keyword, legacyCategoryId, page, sortBy])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== keyword) {
        updateParam('keyword', searchInput.trim() || null)
      }
    }, DEBOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [searchInput])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    if (key === 'category') {
      next.delete('categoryId')
    }
    next.delete('page')
    setSearchParams(next)
  }

  const submitSearch = (event) => {
    event.preventDefault()
    updateParam('keyword', searchInput.trim() || null)
  }

  const setPage = (value) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', `${value}`)
    setSearchParams(next)
  }

  return (
    <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr,0.78fr] lg:items-end">
            <div>
              <p className="section-kicker">Skills directory</p>
              <h1 className="display-title mt-2 text-4xl text-atlas-strong sm:text-5xl">
                {currentCategory ? currentCategory.nameZh : '全部 Skills'}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-atlas-muted">
                {currentCategory?.description ?? '按行业、岗位和热门趋势浏览已爬取的 SKILL.md。'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetaStat label="结果" value={`${pagination.totalElements ?? 0}`} />
              <MetaStat label="当前排序" value={SORT_OPTIONS.find((item) => item.value === sortBy)?.label ?? '最热'} />
              <MetaStat label="筛选项" value={keyword || categorySlug || '全部'} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[300px,1fr]">
          <aside className="space-y-4">
            <div className="atlas-panel px-5 py-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-atlas-strong">
                <Filter className="h-4 w-4" />
                行业筛选
              </div>

              <div className="mt-4 grid gap-4">
                <button
                  type="button"
                  onClick={() => updateParam('category', null)}
                  className={`atlas-button-outline justify-start transition ${!categorySlug && !legacyCategoryId ? 'bg-atlas-teal/10 border-atlas-teal/40 text-atlas-teal' : ''}`}
                >
                  全部行业
                </button>

                {categoryGroups.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <p className="text-xs uppercase tracking-widest font-mono text-atlas-muted">{group.nameZh}</p>
                    <div className="grid gap-2">
                      {group.categories.map((category) => {
                        const isActive = category.slug === categorySlug || `${category.id}` === legacyCategoryId
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => updateParam('category', category.slug)}
                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              isActive
                                ? 'bg-atlas-teal/10 border-atlas-teal/40 text-atlas-teal'
                                : 'bg-atlas-s2 border-atlas-line text-atlas-ink hover:border-atlas-teal/40'
                            }`}
                          >
                            <span>{category.icon} {category.nameZh}</span>
                            <span className="font-mono text-xs">{category.skillCount}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="space-y-5">
            <div className="atlas-panel px-5 py-4">
              <form onSubmit={submitSearch} className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="搜索关键词、作者、行业..."
                    className="atlas-input pl-11"
                  />
                </div>
                <button type="submit" className="atlas-button-solid px-6">
                  搜索
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const active = option.value === sortBy
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateParam('sortBy', option.value)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-atlas-teal text-white shadow-glow-sm'
                          : 'bg-atlas-s2 border-atlas-line text-atlas-muted hover:text-atlas-teal hover:border-atlas-teal/40'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="atlas-panel h-72 animate-pulse" />
                ))}
              </div>
            ) : skills.length === 0 ? (
              <div className="atlas-panel px-8 py-12 text-center">
                <Filter className="mx-auto h-10 w-10 text-atlas-muted" />
                <h3 className="mt-4 text-xl font-semibold text-atlas-strong">没有找到匹配的 Skills</h3>
                <p className="mt-2 text-sm text-atlas-muted">试试换一个行业，或者减少搜索关键词。</p>
                <button type="button" onClick={() => navigate('/skills')} className="atlas-button-outline mt-5">
                  重置筛选
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="atlas-panel flex flex-wrap items-center justify-center gap-2 px-4 py-4">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="atlas-button-outline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  上一页
                </button>

                {Array.from({ length: pagination.totalPages }).slice(0, 8).map((_, index) => {
                  const pageNumber = index
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-10 min-w-10 rounded-full px-3 text-sm font-medium ${
                        pageNumber === page
                          ? 'bg-atlas-teal text-white'
                          : 'bg-atlas-s2 border-atlas-line text-atlas-muted'
                      }`}
                    >
                      {pageNumber + 1}
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={() => setPage(Math.min((pagination.totalPages ?? 1) - 1, page + 1))}
                  disabled={pagination.last}
                  className="atlas-button-outline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function MetaStat({ label, value }) {
  return (
    <div className="rounded-[22px] border border-atlas-line bg-atlas-s3 px-4 py-4">
      <p className="section-kicker">{label}</p>
      <p className="mt-3 font-mono text-2xl text-atlas-teal">{value}</p>
    </div>
  )
}
