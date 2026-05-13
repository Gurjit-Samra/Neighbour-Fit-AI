import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";

import Home from "@/pages/home";
import Questionnaire from "@/pages/questionnaire";
import Results from "@/pages/results";
import SavedResults from "@/pages/results-saved";
import NeighborhoodsIndex from "@/pages/neighborhoods/index";
import NeighborhoodDetail from "@/pages/neighborhoods/detail";
import Compare from "@/pages/compare";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import Favorites from "@/pages/favorites";
import HistoryPage from "@/pages/history";
import AdminDashboard from "@/pages/admin/index";
import AdminNeighborhoods from "@/pages/admin/neighborhoods";
import MapPage from "@/pages/map";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/questionnaire" component={Questionnaire} />
          <Route path="/results" component={Results} />
          <Route path="/results/:id" component={SavedResults} />
          <Route path="/neighborhoods" component={NeighborhoodsIndex} />
          <Route path="/neighborhoods/:slug" component={NeighborhoodDetail} />
          <Route path="/compare" component={Compare} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/map" component={MapPage} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/neighborhoods" component={AdminNeighborhoods} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
