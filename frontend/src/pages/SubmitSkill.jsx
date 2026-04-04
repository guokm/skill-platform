import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  FileArchive,
  FolderTree,
  Lock,
  LogIn,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { authApi, usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function SubmitSkill() {
  const navigate = useNavigate()
  const { isLoggedIn, user, refreshUser } = useAuth()
  const [levelProfile, setLevelProfile] = useState(user?.levelProfile ?? null)
  const [levelLoading, setLevelLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [pricePoints, setPricePoints] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const fileLabel = useMemo(() => {
    if (!file) return '拖入 zip 技能包，或点击选择文件'
    return `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
  }, [file])

  useEffect(() => {
    if (!isLoggedIn) {
      setLevelLoading(false)
      return
    }

    let active = true
    usersApi.myLevel()
      .then((res) => {
        if (active) setLevelProfile(res.data)
      })
      .catch(() => {
        if (active) setLevelProfile(user?.levelProfile ?? null)
      })
      .finally(() => {
        if (active) setLevelLoading(false)
      })

    return () => { active = false }
  }, [isLoggedIn, user?.levelProfile])

  const handleLoginRedirect = async () => {
    sessionStorage.setItem('auth_redirect', window.location.pathname)
    try {
      const res = await authApi.getLoginUrl()
      window.location.href = res.data.url
    } catch {
      navigate('/admin/login')
    }
  }

  const handleFilePick = (event) => {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setError('')
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const nextFile = event.dataTransfer.files?.[0] ?? null
    if (nextFile) {
      setFile(nextFile)
      setError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) {
      setError('请先选择 zip 技能包')
      return
    }

    const normalizedPrice = Number.parseInt(pricePoints, 10)
    if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      setError('默认定价必须是大于等于 0 的整数')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pricePoints', `${normalizedPrice}`)
      const res = await usersApi.uploadSkill(formData)
      setResult(res.data)
      await refreshUser()
      const levelRes = await usersApi.myLevel()
      setLevelProfile(levelRes.data)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.error || '上传失败，请稍后重试')
    } finally {
      setUploading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="px-3 pb-12 pt-6 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-4xl">
          <section className="atlas-panel-dark surface-noise relative overflow-hidden px-8 py-12 text-center">
            <div className="hero-wave opacity-70" />
            <div className="relative z-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal shadow-2xl">
                <PackagePlus className="h-10 w-10" />
              </div>
              <p className="section-kicker mt-6">Submission Portal</p>
              <h1 className="display-title mt-2 text-4xl text-atlas-strong">投稿技能</h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-atlas-muted">
                登录后你就可以直接上传 zip 技能包，系统会自动解压、补全投稿人信息、触发爬取入库，并在条件满足时发放上架奖励积分。
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={handleLoginRedirect} className="atlas-button-solid px-6 py-3">
                  <LogIn className="h-4 w-4" />
                  Linux.do 登录
                </button>
                <Link to="/skills" className="atlas-button-outline px-6 py-3">
                  去逛技能市场
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (levelLoading) {
    return (
      <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="atlas-panel h-40 animate-pulse" />
          <div className="atlas-panel h-[520px] animate-pulse" />
        </div>
      </div>
    )
  }

  const canUploadZip = !!levelProfile?.canUploadZip
  const remainingGrowth = levelProfile?.remainingGrowthToUpload ?? 0
  const uploadUnlockBadge = levelProfile?.uploadUnlockBadge ?? `L${levelProfile?.uploadUnlockRank ?? 0}`
  const uploadUnlockLevelName = levelProfile?.uploadUnlockLevelNameZh ?? '指定等级'

  if (!canUploadZip) {
    return (
      <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <section className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-8 sm:px-8">
            <div className="hero-wave opacity-70" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.08fr,0.92fr]">
              <div>
                <p className="section-kicker">Submission Permission</p>
                <h1 className="display-title mt-2 text-4xl text-atlas-strong sm:text-5xl">投稿权限尚未解锁</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-atlas-muted">
                  你当前的等级还没有到达 zip 投稿门槛。我们会优先开放给已经形成稳定使用和贡献记录的用户，这样能更好地控制资源质量。
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
                    当前等级：{levelProfile?.badge} {levelProfile?.nameZh}
                  </div>
                  <div className="rounded-full border border-atlas-line bg-atlas-s2 px-4 py-2 text-sm text-atlas-muted">
                    成长值：{levelProfile?.growthScore ?? 0}
                  </div>
                  <div className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
                    还差 {remainingGrowth} 点解锁 {uploadUnlockBadge} 投稿
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <GateStat
                  icon={<Lock className="h-5 w-5" />}
                  title="投稿门槛"
                  detail={`达到 ${uploadUnlockBadge} ${uploadUnlockLevelName} 之前，上传 zip 接口会在后端直接拒绝。`}
                  tone="red"
                />
                <GateStat
                  icon={<Sparkles className="h-5 w-5" />}
                  title="升级方式"
                  detail="签到、下载付费资源、持续消费积分、获得更多社区活跃度，都能提升成长值。"
                  tone="amber"
                />
                <GateStat
                  icon={<PackagePlus className="h-5 w-5" />}
                  title="解锁后"
                  detail="你就可以直接上传技能包，系统会自动触发入库并发放上架奖励。"
                  tone="teal"
                />
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[0.92fr,1.08fr]">
            <section className="atlas-panel px-6 py-6 sm:px-8">
              <p className="section-kicker">Growth Path</p>
              <h2 className="display-title mt-2 text-3xl">解锁路线</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <UnlockCard
                  title="每天签到"
                  description="连续签到会累计成长值，也是最稳定的升级方式。"
                  action={<Link to="/me/points" className="atlas-button-solid px-4 py-2 text-xs uppercase tracking-[0.16em]">去签到</Link>}
                />
                <UnlockCard
                  title="下载并使用技能"
                  description="购买和下载技能包会同时增加你的使用记录与成长值。"
                  action={<Link to="/skills" className="atlas-button-outline px-4 py-2 text-xs uppercase tracking-[0.16em]">去浏览技能</Link>}
                />
                <UnlockCard
                  title="提升社区活跃度"
                  description="Linux.do 的 trust level 也会折算成成长值，让社区身份和站内权限保持一致。"
                  action={<div className="rounded-2xl border border-atlas-line bg-atlas-s3 px-4 py-2 text-xs text-atlas-muted">当前 trust: L{user?.trustLevel ?? 0}</div>}
                />
              </div>
            </section>

            <section className="atlas-panel px-6 py-6 sm:px-8">
              <p className="section-kicker">Your Snapshot</p>
              <h2 className="display-title mt-2 text-3xl">当前等级画像</h2>
              <div className="mt-6 rounded-[26px] border border-atlas-line bg-atlas-s2 px-6 py-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
                    {levelProfile?.badge} {levelProfile?.nameZh}
                  </span>
                  <span className="rounded-full border border-atlas-teal/20 bg-atlas-teal/10 px-4 py-2 text-sm font-semibold text-atlas-teal">
                    成长值 {levelProfile?.growthScore ?? 0}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-atlas-muted">{levelProfile?.description}</p>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <SnapshotItem label="已购资源" value={`${levelProfile?.purchasedSkillCount ?? 0} 项`} />
                  <SnapshotItem label="已投稿资源" value={`${levelProfile?.submittedSkillCount ?? 0} 项`} />
                  <SnapshotItem label="下一级" value={levelProfile?.nextLevelNameZh ?? '当前已满级'} />
                  <SnapshotItem label="投稿解锁等级" value={`${uploadUnlockBadge} ${uploadUnlockLevelName}`} />
                  <SnapshotItem label="距离投稿权限" value={`还差 ${remainingGrowth} 成长值`} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 pb-12 pt-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="hero-wave opacity-75" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.12fr,0.88fr]">
            <div>
              <p className="section-kicker">Creator Console</p>
              <h1 className="display-title mt-2 text-4xl text-atlas-strong sm:text-5xl">上传技能包</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-atlas-muted">
                把完整技能包压缩成 zip 后直接上传。系统会自动把文件解压到投稿目录、补上你的 Linux.do 投稿人 ID，并立刻触发一次爬取。
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-atlas-teal/20 bg-atlas-teal/10 px-4 py-2 text-sm font-medium text-atlas-teal">
                  当前投稿人：{user?.username}
                </div>
                <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
                  当前等级：{levelProfile?.badge} {levelProfile?.nameZh}
                </div>
                <div className="rounded-full border border-atlas-line bg-atlas-s2 px-4 py-2 text-sm text-atlas-muted">
                  Linux.do ID：{user?.linuxDoId ?? '未识别'}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <InfoStat
                icon={<FileArchive className="h-5 w-5" />}
                title="压缩格式"
                description="只支持一个 zip 包，内部只包含一个技能目录和一个 SKILL.md。"
              />
              <InfoStat
                icon={<Coins className="h-5 w-5" />}
                title="默认定价"
                description="你可以在上传时设置默认积分定价；如果已有 frontmatter，也会自动同步。"
              />
              <InfoStat
                icon={<ShieldCheck className="h-5 w-5" />}
                title="上架奖励"
                description="系统会自动写入 submitterLinuxDoId，满足条件时可直接拿到上架奖励积分。"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.02fr,0.98fr]">
          <section className="atlas-panel px-6 py-6 sm:px-8">
            <div>
              <p className="section-kicker">Upload Flow</p>
              <h2 className="display-title mt-2 text-3xl">投稿工作台</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <label
                htmlFor="skill-upload-input"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="group flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-atlas-line bg-atlas-s2 px-8 py-10 text-center transition hover:border-atlas-teal/40 hover:bg-atlas-s3"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal shadow-lg">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <p className="mt-5 text-lg font-semibold text-atlas-strong">{fileLabel}</p>
                <p className="mt-3 max-w-xl text-sm leading-7 text-atlas-muted">
                  推荐结构：
                  <code className="mx-1 rounded bg-atlas-s3 px-1.5 py-0.5 text-xs text-atlas-teal">
                    my-skill.zip -&gt; my-skill/SKILL.md + scripts + assets
                  </code>
                  。如果 zip 里没有
                  <code className="mx-1 rounded bg-atlas-s3 px-1.5 py-0.5 text-xs text-atlas-teal">SKILL.md</code>
                  ，系统会直接拒绝导入。
                </p>
                <span className="mt-6 atlas-button-outline px-5 py-2.5 text-xs uppercase tracking-[0.18em]">
                  选择文件
                </span>
                <input
                  id="skill-upload-input"
                  type="file"
                  accept=".zip,application/zip"
                  onChange={handleFilePick}
                  className="hidden"
                />
              </label>

              <div className="grid gap-4 lg:grid-cols-[0.8fr,1.2fr]">
                <div>
                  <label className="section-kicker mb-2 block">默认定价</label>
                  <div className="relative">
                    <Coins className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
                    <input
                      type="number"
                      min="0"
                      value={pricePoints}
                      onChange={(event) => setPricePoints(event.target.value)}
                      className="atlas-input pl-11"
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-atlas-line bg-atlas-s2 px-5 py-5">
                  <p className="section-kicker text-xs">系统会自动帮你做什么</p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-atlas-ink">
                    <p>1. 自动解压 zip 到服务器投稿目录</p>
                    <p>2. 自动把你的 Linux.do ID 写进 `submitterLinuxDoId`</p>
                    <p>3. 若未填写定价，则按这里的默认值写入 `pricePoints`</p>
                    <p>4. 自动触发爬取，成功后资源会直接出现在站点里</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className={`w-full justify-center ${uploading ? 'atlas-button-outline opacity-70 cursor-not-allowed' : 'atlas-button-solid'} px-6 py-3`}
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? '正在上传并入库...' : '上传技能包'}
              </button>
            </form>
          </section>

          <section className="atlas-panel px-6 py-6 sm:px-8">
            <div>
              <p className="section-kicker">Submission Rules</p>
              <h2 className="display-title mt-2 text-3xl">打包说明</h2>
            </div>

            <div className="mt-6 space-y-4">
              <RuleCard
                icon={<FolderTree className="h-5 w-5" />}
                title="推荐目录结构"
                content={`my-skill/\n├── SKILL.md\n├── scripts/\n├── assets/\n└── README.md`}
              />
              <RuleCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="推荐 frontmatter"
                content={`---\nname: my-skill\ncategory: ai-automation\npricePoints: 3\n---`}
              />
              <RuleCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="上传成功后"
                content="如果系统已经识别到技能 slug，你会直接拿到跳转入口；满足条件时上架奖励积分也会自动到账。"
              />
            </div>

            {result && (
              <div className="mt-6 rounded-[26px] border border-emerald-500/20 bg-emerald-500/10 px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-emerald-200">上传成功</p>
                    <p className="mt-2 text-sm leading-7 text-emerald-100/85">{result.message}</p>
                    <div className="mt-4 grid gap-2 text-sm text-emerald-100/85">
                      <p>技能名称：{result.skillName ?? '等待扫描识别'}</p>
                      <p>默认定价：{result.pricePoints} 积分</p>
                      <p>投稿人 ID：{result.submitterLinuxDoId ?? '未写入'}</p>
                      <p>上架奖励：{result.submissionRewardGranted ? '已发放' : '待满足条件后发放'}</p>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {result.skillSlug && (
                        <Link to={`/skills/${result.skillSlug}`} className="atlas-button-solid px-5 py-3">
                          查看资源详情
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                      <Link to="/me/points" className="atlas-button-outline px-5 py-3">
                        去积分中心
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function InfoStat({ icon, title, description }) {
  return (
    <div className="rounded-[24px] border border-atlas-line bg-atlas-s3 px-5 py-5">
      <div className="inline-flex rounded-2xl border border-atlas-teal/20 bg-atlas-teal/10 px-3 py-2 text-atlas-teal">
        {icon}
      </div>
      <p className="mt-4 text-lg font-semibold text-atlas-strong">{title}</p>
      <p className="mt-2 text-sm leading-7 text-atlas-muted">{description}</p>
    </div>
  )
}

function GateStat({ icon, title, detail, tone }) {
  const toneMap = {
    red: 'border-red-500/20 bg-red-500/10 text-red-300',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    teal: 'border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal',
  }
  const styles = toneMap[tone] ?? toneMap.teal

  return (
    <div className="rounded-[24px] border border-atlas-line bg-atlas-s3 px-5 py-5">
      <div className={`inline-flex rounded-2xl border px-3 py-2 ${styles}`}>
        {icon}
      </div>
      <p className="mt-4 text-lg font-semibold text-atlas-strong">{title}</p>
      <p className="mt-2 text-sm leading-7 text-atlas-muted">{detail}</p>
    </div>
  )
}

function UnlockCard({ title, description, action }) {
  return (
    <div className="rounded-[24px] border border-atlas-line bg-atlas-s2 px-5 py-5">
      <p className="text-lg font-semibold text-atlas-strong">{title}</p>
      <p className="mt-2 text-sm leading-7 text-atlas-muted">{description}</p>
      <div className="mt-4">{action}</div>
    </div>
  )
}

function SnapshotItem({ label, value }) {
  return (
    <div className="rounded-[20px] border border-atlas-line bg-atlas-s3 px-4 py-4">
      <p className="section-kicker text-xs">{label}</p>
      <p className="mt-3 font-medium text-atlas-strong">{value}</p>
    </div>
  )
}

function RuleCard({ icon, title, content }) {
  return (
    <div className="rounded-[24px] border border-atlas-line bg-atlas-s2 px-5 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-atlas-teal/20 bg-atlas-teal/10 text-atlas-teal">
          {icon}
        </div>
        <p className="text-lg font-semibold text-atlas-strong">{title}</p>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-[20px] border border-atlas-line bg-atlas-s3 px-4 py-4 text-xs leading-6 text-atlas-ink">
        <code>{content}</code>
      </pre>
    </div>
  )
}
