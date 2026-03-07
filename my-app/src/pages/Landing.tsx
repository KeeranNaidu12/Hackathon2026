import { useNavigate } from 'react-router-dom'

function Landing() {
    const navigate = useNavigate()

    return (
        <main className='min-h-screen bg-gray-300'>
            <div>
            <section>
                <h1 className="landing-kicker m-10 p-3 bg-blue-600 rounded-xl text-white font-bold text-5xl flex justify-center">Hackathon 2026</h1>
                <p className='m-10 text-2xl flex justify-center'>Validate business decisions before you commit.</p>
                
                <div className="bg-blue-100 rounded-lg p-3 m-10">
                <p className='m-10 text-xl flex justify-center'>
                    Unsure about making changes to your business? Run simulations to see whether your
                    idea is likely to help growth, hurt margins, or create hidden risk.
                </p>
                </div>


                <div className="landing-actions flex justify-center">
                    <button type="button" className='m-10 p-2 bg-blue-500 rounded-lg text-white text-xl text-center' onClick={() => navigate('/simulation')}>
                        Start your simulation
                    </button>
                </div>
            </section>

            </div>
        </main>
    )
}

export default Landing