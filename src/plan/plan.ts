export const plans = {
    basico: {
      cpu: 0.5,
      memory: 512,
      replicas: 1,
      appSpace: 1,  // em GB
      dbSpace: 1,   // em GB
    },
    semiPro: {
      cpu: 1,
      memory: 1024,
      replicas: 2,
      appSpace: 2,  // em GB
      dbSpace: 2,   // em GB
    },
    pro: {
      cpu: 2,
      memory: 2048,
      replicas: 3,
      appSpace: 4,  // em GB
      dbSpace: 4,   // em GB
    },
  };