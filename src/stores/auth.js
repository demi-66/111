import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },
  actions: {
    setUser(userData) {
      this.user = userData
      this.token = userData.token
      localStorage.setItem('token', userData.token)
      localStorage.setItem('user', JSON.stringify(userData))
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    checkAuth() {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (savedToken && savedUser) {
        this.token = savedToken
        this.user = JSON.parse(savedUser)
        return true
      }
      return false
    }
  }
})