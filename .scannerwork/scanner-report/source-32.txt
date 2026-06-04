// src/__tests__/Previsions.test.jsx
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as aiService from '../services/aiService'
import Previsions from '../pages/Previsions'

vi.mock('../services/aiService')

const mockAnomalies = [
  { niveau: 'CRITIQUE', poste: 'Energie',     date: '2024-01-05', mois: 'Janvier', realise: 5000, prevu: 3000, ecart: 2000 },
  { niveau: 'CRITIQUE', poste: 'Maintenance', date: '2024-01-10', mois: 'Janvier', realise: 8000, prevu: 5000, ecart: 3000 },
  { niveau: 'ATTENTION', poste: 'Transport',  date: '2024-01-15', mois: 'Janvier', realise: 2000, prevu: 1800, ecart: 200  },
]

const mockCharges = [
  { mois: 'Juin',    poste: 'Energie',     cout_prevu: 1200000 },
  { mois: 'Juillet', poste: 'Energie',     cout_prevu: 1300000 },
  { mois: 'Juin',    poste: 'Maintenance', cout_prevu: 900000  },
]

beforeEach(() => {
  aiService.getPrevisionCharges.mockResolvedValue({ predictions: mockCharges })
  aiService.getAnomalies.mockResolvedValue({ anomalies: mockAnomalies })
})

describe('Previsions', () => {
  it('affiche le loader au départ', () => {
    render(<Previsions />)
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('affiche le nombre de critiques dans le KPI', async () => {
    render(<Previsions />)
    await waitFor(() => expect(screen.queryByText('Chargement...')).not.toBeInTheDocument())
    expect(screen.getByText('Anomalies critiques')).toBeInTheDocument()
    // KPI "2" critiques — utiliser getAllBy car "2" peut apparaître ailleurs
    const kpiNums = screen.getAllByText('2')
    expect(kpiNums.length).toBeGreaterThanOrEqual(1)
  })

  it('affiche le nombre de ATTENTION dans le KPI', async () => {
    render(<Previsions />)
    await waitFor(() => expect(screen.queryByText('Chargement...')).not.toBeInTheDocument())
    expect(screen.getByText('À surveiller')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('affiche les postes en anomalie critique dans la table', async () => {
    render(<Previsions />)
    await waitFor(() => expect(screen.queryByText('Chargement...')).not.toBeInTheDocument())

    // getAllByText car "Energie" apparaît dans la table ET dans les prévisions
    const energieEls = screen.getAllByText('Energie')
    expect(energieEls.length).toBeGreaterThanOrEqual(1)

    const maintenanceEls = screen.getAllByText('Maintenance')
    expect(maintenanceEls.length).toBeGreaterThanOrEqual(1)
  })

  it('affiche les prévisions par poste', async () => {
    render(<Previsions />)
    await waitFor(() => expect(screen.queryByText('Chargement...')).not.toBeInTheDocument())

    // getAllByText car "Juin" apparaît dans Energie ET Maintenance
    const juinEls = screen.getAllByText('Juin')
    expect(juinEls.length).toBeGreaterThanOrEqual(1)

    expect(screen.getByText('Juillet')).toBeInTheDocument()
  })

  it('affiche le titre des prévisions', async () => {
    render(<Previsions />)
    await waitFor(() => expect(screen.queryByText('Chargement...')).not.toBeInTheDocument())
    expect(screen.getByText(/Prévisions des charges/)).toBeInTheDocument()
  })

  it('affiche le titre des anomalies', async () => {
    render(<Previsions />)
    await waitFor(() => expect(screen.queryByText('Chargement...')).not.toBeInTheDocument())
    expect(screen.getByText(/Anomalies détectées/)).toBeInTheDocument()
  })

  it('limite les anomalies critiques à 20 lignes', async () => {
    const beaucoup = Array.from({ length: 25 }, (_, i) => ({
      niveau: 'CRITIQUE', poste: `Poste${i}`, date: '2024-01-01',
      mois: 'Janvier', realise: 5000, prevu: 100, ecart: 4900
    }))
    aiService.getAnomalies.mockResolvedValue({ anomalies: beaucoup })
    render(<Previsions />)
    await waitFor(() => expect(screen.queryByText('Chargement...')).not.toBeInTheDocument())
    const rows = screen.getAllByText(/Poste\d+/)
    expect(rows.length).toBeLessThanOrEqual(20)
  })
})