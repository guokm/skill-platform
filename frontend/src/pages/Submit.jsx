import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Coins, FileArchive, Lock, Upload, X } from 'lucide-react'
import { pointsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Submit() {
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [pricePoints, setPricePoints] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null) // success result
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const canUpload = user?.levelProfile?.canUploadZip ?? false

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.zip')) {
      setError('仅支持 .zip 格式的技能包')
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('文件大小不得超过 50 MB')
      return
    }
    setFile(f)
    setError('')
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || uploading) return
    setUploading(true)
    setProgress(0)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('pricePoints', String(Math.max(0, pricePoints)))

    try {
      const res = await pointsApi.uploadSkill(formData, setProgress)
      setResult(res.data)
      setFile(null)
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? '上传失败，请检查 zip 包内容'
      setError(msg)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-atlas-muted/40" />
          <h2 className="display-title mt-4 text-2xl text-atlas-strong">请先登录</h2>
          <p className="mt-2 text-atlas-muted">登录后才能投稿技能</p>
          <Link to="/admin/login" className="atlas-button-solid mt-6 inline-flex px-6 py-3">去登录</Link>
        </div>
      </div>
    )
  }

  if (!canUpload) {
    const level = user?.levelProfile
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="atlas-panel max-w-md w-full px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl">🔒</div>
          <h2 className="display-title mt-5 text-2xl text-atlas-strong">尚未解锁投稿权限</h2>
          <p className="mt-2 text-sm text-atlas-muted">
            上传 Skill 需要达到 <span className="text-amber-400 font-semibold">{level?.uploadUnlockLevelNameZh ?? 'L3 共创者'}</span> 等级
          </p>
          {level && (
            <div className="mt-6 rounded-xl border border-atlas-line bg-atlas-s2 px-5 py-4 text-left">
              <div className="flex items-center justify-between text-xs text-atlas-muted mb-2">
                <span>当前: {level.nameZh} ({level.badge})</span>
                <span>目标: {level.uploadUnlockLevelNameZh} ({level.uploadUnlockBadge})</span>
              </div>
              <div className="w-full rounded-full bg-atlas-s3 h-2">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((level.growthScore) / (level.uploadUnlockThreshold || 100)) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-amber-400">
                还需 {level.remainingGrowthToUpload} 成长值
              </p>
            </div>
          )}
          <div className="mt-6 space-y-2 text-sm text-atlas-muted text-left">
            <p className="font-semibold text-atlas-ink mb-1">快速提升成长值：</p>
            <p>📅 每日签到 +3 成长值</p>
            <p>⚡ 每下载一个技能 +8 成长值</p>
            <p>💰 消费积分同等增加成长值</p>
          </div>
          <Link to="/me/points" className="atlas-button-solid mt-6 inline-flex w-full justify-center py-3">查看我的等级进度</Link>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="atlas-panel max-w-md w-full px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="display-title mt-5 text-2xl text-atlas-strong">上传成功！</h2>
          <p className="mt-2 text-sm text-atlas-muted">{result.message}</p>

          <div className="mt-6 space-y-2 text-left">
            {result.skillName && (
              <div className="rounded-xl border border-atlas-line bg-atlas-s2 px-4 py-3">
                <p className="text-xs text-atlas-muted">技能名称</p>
                <p className="font-semibold text-atlas-strong">{result.skillName}</p>
              </div>
            )}
            <div className="rounded-xl border border-atlas-line bg-atlas-s2 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-atlas-muted">定价</p>
              <p className="font-mono text-atlas-teal font-bold">{result.pricePoints} 积分</p>
            </div>
            {result.submissionRewardGranted && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-400" />
                <p className="text-sm text-emerald-400">投稿奖励积分已到账！</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {result.skillSlug && (
              <button onClick={() => navigate(`/skills/${result.skillSlug}`)} className="atlas-button-solid w-full justify-center py-3">
                查看已上架的 Skill
              </button>
            )}
            <button onClick={() => setResult(null)} className="atlas-button-outline w-full justify-center py-3">
              再上传一个
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-5">

        {/* Header */}
        <div className="atlas-panel-dark surface-noise relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="hero-wave opacity-50" />
          <div className="relative z-10">
            <p className="section-kicker">Creator Studio</p>
            <h1 className="display-title mt-2 text-3xl text-atlas-strong">上传技能包</h1>
            <p className="mt-2 text-sm text-atlas-muted">
              将你的 SKILL.md 打包成 .zip 上传，审核通过后自动上架。
              每次下载你获得 <span className="text-amber-400 font-semibold">70%</span> 积分分成。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`atlas-panel cursor-pointer flex flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-dashed px-6 py-14 text-center transition ${
              dragOver ? 'border-atlas-teal bg-atlas-teal/5' : 'border-atlas-line hover:border-atlas-teal/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {file ? (
              <>
                <FileArchive className="h-12 w-12 text-atlas-teal" />
                <div>
                  <p className="font-semibold text-atlas-strong">{file.name}</p>
                  <p className="text-sm text-atlas-muted mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="flex items-center gap-1 text-xs text-atlas-muted hover:text-rose-400 transition"
                >
                  <X className="h-3.5 w-3.5" /> 重新选择
                </button>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-atlas-muted/50" />
                <div>
                  <p className="font-semibold text-atlas-strong">拖放 .zip 到此处，或点击选择文件</p>
                  <p className="text-sm text-atlas-muted mt-1">zip 内必须包含 SKILL.md，最大 50 MB</p>
                </div>
              </>
            )}
          </div>

          {/* Price */}
          <div className="atlas-panel px-5 py-5">
            <label className="block">
              <p className="section-kicker text-xs mb-3">Price Settings · 定价</p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-teal" />
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={pricePoints}
                    onChange={(e) => setPricePoints(Number(e.target.value))}
                    className="atlas-input pl-10"
                    placeholder="0 = 免费"
                  />
                </div>
                <span className="text-sm text-atlas-muted whitespace-nowrap">积分 / 次下载</span>
              </div>
            </label>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[0, 5, 20, 50].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPricePoints(p)}
                  className={`rounded-xl border px-3 py-2 text-xs font-mono transition ${
                    pricePoints === p ? 'border-atlas-teal bg-atlas-teal/10 text-atlas-teal' : 'border-atlas-line text-atlas-muted hover:border-atlas-teal/40'
                  }`}
                >
                  {p === 0 ? '免费' : `${p} 积分`}
                </button>
              ))}
            </div>
            {pricePoints > 0 && (
              <p className="mt-3 text-xs text-atlas-muted">
                每次下载你获得 <span className="text-emerald-400 font-semibold">{Math.floor(pricePoints * 0.7)} 积分</span>（70% 分成）
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/80 px-4 py-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="atlas-panel px-5 py-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-atlas-muted">上传中…</span>
                <span className="font-mono text-atlas-teal">{progress}%</span>
              </div>
              <div className="w-full rounded-full bg-atlas-s2 h-2">
                <div className="h-full progress-shimmer rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || uploading}
            className="atlas-button-solid w-full justify-center py-4 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '正在处理…' : <><Upload className="h-4 w-4" /> 提交技能包</>}
          </button>
        </form>

        {/* Guide */}
        <div className="atlas-panel px-5 py-5">
          <p className="section-kicker text-xs mb-3">打包指南</p>
          <div className="space-y-2 text-sm text-atlas-muted">
            <p>✅ zip 内必须包含 <span className="font-mono text-atlas-teal">SKILL.md</span>，且只能有一个</p>
            <p>✅ SKILL.md 需有 YAML frontmatter（name、description 等字段）</p>
            <p>✅ 可附带任意支持文件（示例、图片、子文件夹）</p>
            <p>❌ 请勿包含 node_modules / .git 等大型无关目录</p>
          </div>
          <pre className="mt-4 rounded-xl border border-atlas-line bg-atlas-s2 px-4 py-3 text-xs text-atlas-teal overflow-x-auto">{`---
name: 我的 Skill 名称
description: 功能描述
author: YourName
version: 1.0.0
tags: [react, frontend]
---

## 使用说明
...`}</pre>
        </div>

      </div>
    </div>
  )
}
