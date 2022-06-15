import { Base } from "./Base";
import BarChart from './charts/BarChart';
export const Widget = (payload) => {
    const _data = payload.data;
    return (
        <Base>
            <BarChart width={600} height={400} data={_data} />
        </Base>
    );
};
