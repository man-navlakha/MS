import React from 'react'
import { useNavigate } from 'react-router-dom'
import LocationMap from './LocationMap'
import PunctureRequestForm from './PunctureRequestForm'
import UserDashboard from './UserDashboard'

const MainPage = () => {
  const navigate = useNavigate()
  return (
    <div>
    <UserDashboard />
    </div>
  )
}

export default MainPage
