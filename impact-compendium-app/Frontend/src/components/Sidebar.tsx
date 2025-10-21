import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  Users
} from 'lucide-react';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/hooks/useAuth';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Studies',
    url: '/studies',
    icon: FileText,
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
  },
];

const adminItems = [
  {
    title: 'Admin',
    url: '/admin',
    icon: Settings,
    requiredRole: 'admin',
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
    requiredRole: 'admin',
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const canAccess = (requiredRole?: string) => {
    if (!requiredRole) return true;
    return user?.role === requiredRole || user?.role === 'admin';
  };

  return (
    <SidebarPrimitive className="border-r">
      <SidebarHeader className="p-6">
        <BrandLogo />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <Button asChild className="w-full justify-start">
                <Link to="/studies/create">
                  <Plus className="h-4 w-4 mr-2" />
                  New Study
                </Link>
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && canAccess('admin') && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => 
                  canAccess(item.requiredRole) && (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </SidebarPrimitive>
  );
};

export default Sidebar;
