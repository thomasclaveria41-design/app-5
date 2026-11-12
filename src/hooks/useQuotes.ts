import { useEffect, useState } from 'react'
import type { Quote } from '../types'
import { repository } from '../services/storage'
import { calc } from '../utils/calc'
import { clone } from '../utils/format'
import { mergeQuotes } from '../utils/quote'

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])

  useEffect(() => {
    let alive = true
    repository.loadQuotes().then((q) => { if (alive) setQuotes(q) })
    return () => { alive = false }
  }, [])

  /** Actualiza la lista en pantalla y la guarda. Devuelve false si el guardado falló. */
  const persist = async (list: Quote[]): Promise<boolean> => {
    setQuotes(list)
    try {
      await repository.saveQuotes(list)
      return true
    } catch {
      return false
    }
  }

  const upsert = (q: Quote): Promise<boolean> => {
    const rec: Quote = { ...clone(q), total: calc(q).total, upd: Date.now() }
    const i = quotes.findIndex((x) => x.id === q.id)
    return persist(i >= 0 ? quotes.map((x, j) => (j === i ? rec : x)) : [rec, ...quotes])
  }
  const remove = (id: string) => persist(quotes.filter((x) => x.id !== id))
  const merge = (incoming: Quote[]) => persist(mergeQuotes(quotes, incoming))

  return { quotes, upsert, remove, merge }
}
