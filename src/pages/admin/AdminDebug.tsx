import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {};

    try {
      console.log('Starting diagnostics...');
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      info.currentUser = user;
      info.userId = user?.id;

      // Check if user exists in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      info.profileError = profileError;
      info.profile = profileData;

      // Check user roles
      console.log('Checking user roles...');
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user?.id);
      console.log('Roles data:', rolesData, 'error:', rolesError);
      info.rolesError = rolesError;
      info.userRoles = rolesData;

      // Try to fetch all profiles (should work if user is admin)
      console.log('Fetching all profiles...');
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      console.log('All profiles count:', allProfiles?.length, 'error:', allProfilesError);
      info.allProfilesError = allProfilesError;
      info.allProfilesCount = allProfiles?.length;
      info.sampleProfiles = allProfiles?.slice(0, 3);

      // Check has_role function directly (for debugging)
      console.log('Checking has_role RPC...');
      const { data: hasRoleData, error: hasRoleError } = await supabase.rpc('has_role', {
        _user_id: user?.id,
        _role: 'admin',
      });
      console.log('has_role result:', hasRoleData, 'error:', hasRoleError);
      info.hasAdminRoleError = hasRoleError;
      info.hasRoleRpcResult = hasRoleData;

      // Use the fetched roles to determine admin status
      info.isAdmin = rolesData && rolesData.some(r => r.role === 'admin');

      // Try to get total count of profiles
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      info.totalProfilesError = countError;
      info.totalProfiles = count;

      // Try using WITH CHECK to see bypass possibilities
      info.suggestion = '';
      if (rolesData && rolesData.length > 0) {
        const hasAdminRole = rolesData.some(r => r.role === 'admin');
        info.hasAdminRoleInTable = hasAdminRole;
        
        if (hasAdminRole && !allProfiles) {
          info.suggestion = 'You have admin role but profiles query failed. This suggests an RLS policy issue with the profiles table SELECT policy.';
        }
      }

    } catch (error: any) {
      console.error('Fatal error in diagnostics:', error);
      info.fatalError = error.message;
    } finally {
      console.log('Diagnostics completed, info:', info);
      setDebugInfo(info);
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const assignAdminRole = async () => {
    try {
      console.log('Assigning admin role...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User for assign:', user);
      if (!user) return;

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });
      console.log('Insert error:', error);

      if (error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.success('Admin role assigned! Refreshing...');
        setTimeout(() => runDiagnostics(), 1000);
      }
    } catch (error: any) {
      console.error('Exception in assignAdminRole:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Debug Panel</CardTitle>
          <CardDescription>Diagnose why users aren't showing in admin panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running diagnostics...' : 'Run Diagnostics'}
          </Button>

          <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>

          {!debugInfo.isAdmin && (
            <div className="p-4 bg-yellow-100 rounded-lg">
              <p className="font-bold text-yellow-900">⚠️ Current user is NOT an admin</p>
              <p className="text-yellow-800 text-sm mt-2">
                This is why users aren't showing. Click the button below to assign admin role.
              </p>
              <Button onClick={assignAdminRole} className="mt-2 bg-yellow-600 hover:bg-yellow-700">
                Assign Admin Role to Current User
              </Button>
            </div>
          )}

          {debugInfo.isAdmin && (
            <div className="p-4 bg-green-100 rounded-lg">
              <p className="font-bold text-green-900">✓ Current user IS an admin</p>
              <p className="text-green-800 text-sm mt-2">
                Total profiles in database: {debugInfo.totalProfiles}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
