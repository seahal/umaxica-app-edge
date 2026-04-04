export default function HealthPage() {
  return <div>OK</div>;
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}

export const config = {
  runtime: 'edge',
};
