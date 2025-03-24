import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import AuthNavbar from '@/components/AuthNavbar'
import { useLoginMutation } from '@/store/services/authApi'
import { setCredentials } from '@/store/slices/authSlice'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { toast } = useToast()

  const [login, { isLoading }] = useLoginMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const userData = await login({ email, password }).unwrap()
      dispatch(setCredentials(userData))
      toast({
        title: "Success",
        description: "Successfully signed in!",
      })
      navigate('/dashboard')
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.data?.message || "Something went wrong",
      })
    }
  }

  return (
    <>
      <AuthNavbar />
      <div className="flex items-center justify-center min-h-screen bg-background pt-16">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button 
                type="button" 
                variant="link"
                className="w-full"
                onClick={() => navigate('/login/signup')}
              >
                Don't have an account? Sign up
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  )
}
