export function formatCount(value = 0) {
  const number = Number(value || 0)

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}k`
  }

  return `${number}`
}

export function formatDate(value) {
  if (!value) {
    return '未记录'
  }

  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
