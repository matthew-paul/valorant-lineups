import React from "react";
import {
  useNavigate,
  useParams,
  type NavigateFunction,
  type Params,
} from "react-router-dom";

export interface RouterProps {
  navigate: NavigateFunction;
  params: Readonly<Params<string>>;
}

export function withRouter<Props extends RouterProps>(
  Component: React.ComponentType<Props>
): React.ComponentType<Omit<Props, keyof RouterProps>> {
  type OuterProps = Omit<Props, keyof RouterProps>;

  const Wrapper = (props: OuterProps): JSX.Element => {
    const navigate = useNavigate();
    const params = useParams();
    const componentProps = {
      ...props,
      navigate,
      params,
    } as Props;

    return <Component {...componentProps} />;
  };

  const componentName = Component.displayName ?? Component.name ?? "Component";
  Wrapper.displayName = `withRouter(${componentName})`;

  return Wrapper;
}
