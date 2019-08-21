import React, { PureComponent } from "react"
import { SectionListRenderItemInfo, View, SectionList, SectionListData, SectionListProps } from "react-native";
import moment from "moment";
import { Text } from "native-base";

interface Section<T> extends SectionListData<T> {
    key: string,
    data: Array<T>,
}

interface AllProps<T> extends SectionListProps<T> {
    items: Array<T>,
    getItemDate: (item: T) => Date,
    renderItem: (args: SectionListRenderItemInfo<T>) => JSX.Element,
    keyExtractor: (item: T) => string,
    renderSectionHeaderAdditionalData?: (section: Section<T>) => JSX.Element,
}

type Props<T> = Omit<AllProps<T>, "sections">

function DateSectionList<T>(props: Props<T>) {
    var sections: Section<T>[] = [];
    var lastSection: Section<T> | undefined;
    var lastDate: Date | undefined;

    props.items.forEach(i => {
        const date = props.getItemDate(i);

        if (!lastDate || lastDate.getDate() != date.getDate() || lastDate.getFullYear() != date.getFullYear() || lastDate.getMonth() != date.getMonth()) {
            lastSection = {
                key: moment(props.getItemDate(i)).format("MMMM Do YYYY"),
                data: [],
            }
            lastDate = date;

            sections.push(lastSection)
        }

        lastSection!.data.push(i)
    })

    return (
        <SectionList sections={sections} stickySectionHeadersEnabled={true}
            renderSectionHeader={(info) => {
                const section = info.section as Section<T>

                return (
                    <View style={{ backgroundColor: "lightgrey", alignItems: "center" }}>
                        <Text style={{ fontWeight: 'bold' }}>{section.key}</Text>
                        {props.renderSectionHeaderAdditionalData && props.renderSectionHeaderAdditionalData(section)}
                    </View>
                )
            }}
            renderItem={(args: SectionListRenderItemInfo<T>) => props.renderItem(args)}
            {...props}
        />
    )
}

export default DateSectionList