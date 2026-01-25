import React from 'react'
import Navbar from '../components/Navbar'

function Sidebar() {
    return (
        <div className='w-[20%] h-full bg-slate-900 px-3 py-2'>
            <button>Dashboard</button>
        </div>
    )
}

function Dashboard() {
    return (
        <div className='w-screen h-screen flex'>
            <Navbar />
            <div className='dashboard h-full w-full bg-red-300 mt-16'>
                <Sidebar />
            </div>
        </div>
    )
}

export default Dashboard