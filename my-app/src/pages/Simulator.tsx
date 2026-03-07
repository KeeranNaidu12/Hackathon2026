import { useMemo, useState } from 'react'

function Simulator() {
    const [simulationInput, setSimulationInput] = useState('')

    const results = useMemo(() => {
        const trimmed = simulationInput.trim()
        if (!trimmed) {
            return null
        }

        const words = trimmed.split(/\s+/).length
        const hasRiskWords = /risk|loss|cost|delay|issue|problem/i.test(trimmed)

        return {
            summary: hasRiskWords
                ? 'Input suggests potential risk factors that should be reviewed before launch.'
                : 'Input appears generally optimistic, but still validate assumptions with real data.',
            confidence: hasRiskWords ? 'Medium' : 'Medium-High',
            nextStep: hasRiskWords
                ? 'Run a downside scenario and compare with your baseline assumptions.'
                : 'Run a downside scenario anyway to pressure-test this idea.',
            wordCount: words,
        }
    }, [simulationInput])

    return (
        <main className="min-h-screen bg-gray-200 px-4 py-10">
            <section className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-lg md:p-8">
                <h1 className="text-center text-4xl font-bold text-slate-800 md:text-5xl">Simulation</h1>
                <p className="mt-4 text-center text-lg text-slate-600">
                    Enter your business change idea below. Results will appear underneath.
                </p>

                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label htmlFor="simulation-input" className="mb-2 block text-sm font-semibold text-slate-700">
                        Simulation Input
                    </label>
                    <textarea
                        id="simulation-input"
                        className="min-h-40 w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-800 outline-none ring-blue-300 transition focus:ring-2"
                        placeholder="Example: If we hire 2 part-time staff and lower prices by 5%, how will revenue and cost change over 3 months?"
                        value={simulationInput}
                        onChange={(e) => setSimulationInput(e.target.value)}
                    />
                </div>

                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h2 className="text-xl font-bold text-slate-800">Results</h2>

                    {!results ? (
                        <p className="mt-3 text-slate-600">Add simulation text above to generate output results.</p>
                    ) : (
                        <div className="mt-4 grid gap-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-sm font-semibold text-slate-500">Summary</p>
                                <p className="mt-1 text-slate-800">{results.summary}</p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-sm font-semibold text-slate-500">Confidence</p>
                                <p className="mt-1 text-slate-800">{results.confidence}</p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-sm font-semibold text-slate-500">Suggested Next Step</p>
                                <p className="mt-1 text-slate-800">{results.nextStep}</p>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-sm font-semibold text-slate-500">Input Word Count</p>
                                <p className="mt-1 text-slate-800">{results.wordCount}</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Simulator
