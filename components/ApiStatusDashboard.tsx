// components/ApiStatusDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Clipboard } from 'react-native';
import { Feather } from '@expo/vector-icons';

const API_BASE_URL = 'http://127.0.0.1:3000';

interface Endpoint {
  path: string;
  name: string;
  requiresAuth: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

interface EndpointStatusData {
  status: 'working' | 'auth' | 'error' | 'manual';
  message?: string;
  statusCode?: number;
  data?: any;
  method?: string;
}

type EndpointStatusMap = Record<string, EndpointStatusData>;

interface StatusBadgeProps {
  status: 'working' | 'auth' | 'error' | 'manual' | undefined;
}

const endpoints: Endpoint[] = [
  { path: '/api/health', name: 'Health Check', requiresAuth: false },
  { path: '/api/auth/google', name: 'Google Auth', requiresAuth: false, method: 'POST' },
  { path: '/api/user/profile', name: 'User Profile', requiresAuth: true },
  { path: '/api/restaurants', name: 'Restaurants', requiresAuth: false },
  { path: '/api/orders', name: 'Create Order', requiresAuth: true, method: 'POST' },
  { path: '/api/user/orders', name: 'User Orders', requiresAuth: true },
  { path: '/api/delivery/requests', name: 'Delivery Requests', requiresAuth: true },
  { path: '/api/users/favorites', name: 'User Favorites', requiresAuth: true }
];

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'working') {
    return (
      <View style={styles.badgeSuccess}>
        <Feather name="check" size={12} color="#166534" style={styles.badgeIcon} />
        <Text style={styles.badgeTextSuccess}>Working</Text>
      </View>
    );
  } else if (status === 'auth') {
    return (
      <View style={styles.badgeWarning}>
        <Feather name="alert-circle" size={12} color="#854d0e" style={styles.badgeIcon} />
        <Text style={styles.badgeTextWarning}>Requires Auth</Text>
      </View>
    );
  } else {
    return (
      <View style={styles.badgeError}>
        <Feather name="alert-circle" size={12} color="#991b1b" style={styles.badgeIcon} />
        <Text style={styles.badgeTextError}>Not Working</Text>
      </View>
    );
  }
}

const ApiStatusDashboard = () => {
  const [endpointStatus, setEndpointStatus] = useState<EndpointStatusMap>({});
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEndpoints = async () => {
      const results: EndpointStatusMap = {};
      
      for (const endpoint of endpoints) {
        try {
          // Skip POST endpoints for automatic testing
          if (endpoint.method === 'POST') {
            results[endpoint.path] = {
              status: 'manual',
              message: 'POST endpoint requires manual testing',
              method: 'POST'
            };
            continue;
          }
          
          const response = await fetch(`${API_BASE_URL}${endpoint.path}`);
          
          if (response.status === 401 || response.status === 403) {
            results[endpoint.path] = {
              status: 'auth',
              message: 'Authentication required',
              statusCode: response.status
            };
          } else if (response.ok) {
            const data = await response.json();
            results[endpoint.path] = {
              status: 'working',
              data,
              statusCode: response.status
            };
          } else {
            results[endpoint.path] = {
              status: 'error',
              message: response.statusText,
              statusCode: response.status
            };
          }
        } catch (error) {
          results[endpoint.path] = {
            status: 'error',
            message: error instanceof Error ? error.message : String(error)
          };
        }
      }
      
      setEndpointStatus(results);
      setLoading(false);
    };
    
    checkEndpoints();
  }, []);
  
  const toggleEndpoint = (path: string) => {
    if (expandedEndpoint === path) {
      setExpandedEndpoint(null);
    } else {
      setExpandedEndpoint(path);
    }
  };
  
  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>DormDash API Status Dashboard</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Checking endpoints...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {endpoints.map((endpoint) => (
            <View key={endpoint.path} style={styles.endpointCard}>
              <TouchableOpacity 
                style={styles.endpointHeader}
                onPress={() => toggleEndpoint(endpoint.path)}
              >
                <View>
                  <Text style={styles.endpointName}>{endpoint.name}</Text>
                  <View style={styles.endpointMeta}>
                    <Text style={[
                      styles.endpointMethod,
                      endpoint.method === 'POST' ? styles.endpointMethodPost : null
                    ]}>
                      {endpoint.method || 'GET'} 
                    </Text>
                    <Text style={styles.endpointSeparator}>|</Text>
                    <Text style={styles.endpointPath}>{endpoint.path}</Text>
                  </View>
                </View>
                <View style={styles.endpointStatus}>
                  <StatusBadge 
                    status={
                      endpointStatus[endpoint.path]?.status === 'auth' && endpoint.requiresAuth
                        ? 'working'
                        : endpointStatus[endpoint.path]?.status
                    } 
                  />
                  <Feather 
                    name={expandedEndpoint === endpoint.path ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#666"
                    style={styles.expandIcon}
                  />
                </View>
              </TouchableOpacity>
              
              {expandedEndpoint === endpoint.path && (
                <View style={styles.endpointDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status Code:</Text> 
                    <Text style={styles.detailValue}>
                      {endpointStatus[endpoint.path]?.statusCode || 'N/A'}
                    </Text>
                  </View>
                  
                  {endpointStatus[endpoint.path]?.status === 'working' && (
                    <View>
                      <View style={styles.responseHeader}>
                        <Text style={styles.detailLabel}>Response:</Text>
                        <TouchableOpacity 
                          onPress={() => copyToClipboard(JSON.stringify(endpointStatus[endpoint.path]?.data, null, 2))}
                          style={styles.copyButton}
                        >
                          <Feather name="copy" size={12} color="#2563eb" style={styles.copyIcon} />
                          <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView 
                        style={styles.responseContainer}
                        horizontal={true}
                      >
                        <Text style={styles.responseText}>
                          {JSON.stringify(endpointStatus[endpoint.path]?.data, null, 2)}
                        </Text>
                      </ScrollView>
                    </View>
                  )}
                  
                  {endpointStatus[endpoint.path]?.status === 'auth' && (
                    <View>
                      <Text style={styles.authText}>
                        {endpoint.requiresAuth 
                          ? 'This endpoint requires authentication, which is expected behavior.' 
                          : 'Authentication required for this endpoint.'}
                      </Text>
                      <Text style={styles.authHint}>
                        To test, you need to provide an authentication token in the Authorization header.
                      </Text>
                    </View>
                  )}
                  
                  {endpointStatus[endpoint.path]?.status === 'error' && (
                    <Text style={styles.errorText}>
                      Error: {endpointStatus[endpoint.path]?.message}
                    </Text>
                  )}
                  
                  {endpointStatus[endpoint.path]?.status === 'manual' && (
                    <View>
                      <Text style={styles.manualText}>
                        This endpoint requires manual testing with a POST request.
                      </Text>
                      <View style={styles.exampleContainer}>
                        <Text style={styles.exampleLabel}>Example request:</Text>
                        <ScrollView 
                          style={styles.codeContainer}
                          horizontal={true}
                        >
                          <Text style={styles.codeText}>
                            {endpoint.path === '/api/auth/google' ? 
                              `fetch("${API_BASE_URL}${endpoint.path}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    idToken: "YOUR_GOOGLE_ID_TOKEN"
  })
})` : 
                              endpoint.path === '/api/orders' ?
                              `fetch("${API_BASE_URL}${endpoint.path}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_AUTH_TOKEN"
  },
  body: JSON.stringify({
    restaurantId: 1,
    totalAmount: 15.99,
    deliveryFee: 3.99,
    deliveryAddress: "Vanderbilt Campus",
    notes: "Leave at door"
  })
})` : ''}
                          </Text>
                        </ScrollView>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
          
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <View style={styles.notesList}>
              <View style={styles.noteItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.noteText}>
                  Authenticated endpoints will show "Requires Auth" unless an auth token is provided.
                </Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.noteText}>
                  POST endpoints require manual testing with appropriate request bodies.
                </Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.noteText}>
                  API Base URL: {API_BASE_URL}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    gap: 16,
  },
  endpointCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  endpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  endpointName: {
    fontSize: 16,
    fontWeight: '500',
  },
  endpointMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  endpointMethod: {
    fontSize: 14,
    color: '#666',
  },
  endpointMethodPost: {
    color: '#2563eb',
    fontWeight: '500',
  },
  endpointSeparator: {
    marginHorizontal: 8,
    color: '#ccc',
  },
  endpointPath: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  endpointStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    marginLeft: 8,
  },
  endpointDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f5f5f5',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyIcon: {
    marginRight: 4,
  },
  copyText: {
    fontSize: 12,
    color: '#2563eb',
  },
  responseContainer: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  responseText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#f1f5f9',
  },
  authText: {
    fontSize: 14,
    color: '#854d0e',
    marginBottom: 8,
  },
  authHint: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  manualText: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 8,
  },
  exampleContainer: {
    marginTop: 8,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  codeContainer: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    maxHeight: 180,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#f1f5f9',
  },
  notes: {
    marginTop: 16,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  notesList: {
    gap: 4,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginTop: 5,
    marginRight: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeTextSuccess: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '500',
  },
  badgeWarning: {
    backgroundColor: '#fef9c3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeTextWarning: {
    color: '#854d0e',
    fontSize: 12,
    fontWeight: '500',
  },
  badgeError: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeTextError: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '500',
  },
  badgeIcon: {
    marginRight: 4,
  },
});

export default ApiStatusDashboard;