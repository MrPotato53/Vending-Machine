import { Pressable, StyleSheet, View, Text, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const items = [
  //imort items from DB
]

export default  function matrixItems(props) {
  return(  
    <div ClassName  = "container mnt-4">
    {items.map((item) => (
        itemCard(item)
      
    ))}
    </div>
  )
}

export default function itemCard(props) {
    const navigation = useNavigation();
    function press(){
        navigation.push("Item", props);
    }
    return <Pressable onPress={press}>
        <View style={[styles.card, props.style]}>
           <Image alt = {props.id} style={{height:200, width:300, padding:20}} source={{uri:props.Image}}/>
           <Text>{props.name}</Text>
        </View>
    </Pressable>
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        elevation: 5,
        borderRadius: 10,
        backgroundColor: 'slategray',
        shadowOffset: {
          width: 4,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    }
})