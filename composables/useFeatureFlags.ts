export default () => {
  const config = useRuntimeConfig();
  const featureFlags = config.public.feature as Record<string, boolean>;

  const featureIsEnabled = (feature: string): boolean => {
    return featureFlags[feature] === true;
  };

  return {
    featureIsEnabled,
  };
};
