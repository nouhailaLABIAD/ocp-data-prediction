import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPrevisionCharges, getPrevisionProduction, getAnomalies, sendChat } from '../services/aiService'

global.fetch = vi.fn()

beforeEach(() => vi.clearAllMocks())

describe('aiService', () => {
  it('getPrevisionCharges appelle la bonne URL', async () => {
    fetch.mockResolvedValue({ json: async () => ({ predictions: [] }) })
    const result = await getPrevisionCharges()
    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/prediction/charges')
    expect(result).toHaveProperty('predictions')
  })

  it('getPrevisionProduction retourne un objet', async () => {
    fetch.mockResolvedValue({ json: async () => ({ predictions: [] }) })
    const result = await getPrevisionProduction()
    expect(result).toHaveProperty('predictions')
  })

  it('getAnomalies retourne anomalies', async () => {
    fetch.mockResolvedValue({ json: async () => ({ anomalies: [], total: 0 }) })
    const result = await getAnomalies()
    expect(result).toHaveProperty('anomalies')
  })

  it('sendChat envoie messages + mois + annee', async () => {
    fetch.mockResolvedValue({ json: async () => ({ reply: 'OK' }) })
    const result = await sendChat([{ role: 'user', content: 'test' }], 'Mars', 2024)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/chat',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result).toHaveProperty('reply')
  })

  it('sendChat fonctionne sans mois ni annee', async () => {
    fetch.mockResolvedValue({ json: async () => ({ reply: 'OK' }) })
    const result = await sendChat([{ role: 'user', content: 'test' }])
    expect(result.reply).toBe('OK')
  })
})