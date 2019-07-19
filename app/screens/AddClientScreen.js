import React, { useReducer } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { TextField } from 'react-native-material-textfield';
import {
    Text,
    View,
    StyleSheet,
    ScrollView,
    Button
} from 'react-native';

function removeEmailExtension(email) {
    if (email.indexOf('@') > -1)
        return email.split('@')[0];
    return email;
}

function addClientReducer(state, action) {
    switch (action.type) {
        case 'field':
            return {
                ...state,
                [action.field_name]: action.value
            }
        case 'email_button':
            let newEmail = removeEmailExtension(state.email) + action.value;
            return {
                ...state,
                email: newEmail,
            }
        case 'submit':
            return {
                ...state,
                isLoading: true
            }
        case 'success':
            return {
                ...state,
                isLoading: false
            }
        case 'error':
            return {
                ...state,
                isLoading: false,
                error: action.message
            }
        default:
            break;
    }
}

const emailExtensionList = ['@gmail.com', '@abv.bg', '@mail.bg', '@icloud.com', '@outlook.com', '@yahoo.com']

const initialState = {
    email: '',
    phone: '',
    names: '',
    isLoading: false
};

export default function AddClientScreen() {

    const [state, dispatch] = useReducer(addClientReducer, initialState);
    const { email, phone, names, isLoading, error } = state;

    const createUser = (user) => {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const options = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(user),
        }

        const url = 'http://192.168.0.106:3000/client';
        const request = new Request(url, options);

        fetch(request)
            .then((res) => {
                console.log(`status = ${res.status !== 200}`);
                if (res.status !== 200) {
                    return dispatch({
                        type: 'error',
                        message: 'Грешка с номер: ' + res.status
                    });
                }
                dispatch({ type: 'success' });
            })
            .catch((err) => {
                console.log(err);
                dispatch({
                    type: 'error',
                    message: err.message
                })
            });
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Добави Клиент</Text>
                </View>

                <View style={styles.fieldsContainer}>
                    <TextField
                        label='Мейл (задължително)'
                        value={email}
                        onChangeText={(text) =>
                            dispatch({
                                type: 'field',
                                value: text,
                                field_name: 'email',
                            })
                        }
                    />

                    <View style={styles.horizontalButtons}>
                        {emailExtensionList.map(((ext, index) => {
                            return (<Button
                                key={index}
                                title={ext}
                                color={'green'}
                                onPress={() => {
                                    dispatch({
                                        type: 'email_button',
                                        value: ext
                                    });
                                }}
                            />);
                        }))}
                    </View>

                    <TextField
                        label='Телефон'
                        value={phone}
                        keyboardType='numeric'
                        onChangeText={(text) =>
                            dispatch({
                                type: 'field',
                                value: text,
                                field_name: 'phone',
                            })
                        }
                    />

                    <TextField
                        label='Имена'
                        value={names}
                        onChangeText={(text) =>
                            dispatch({
                                type: 'field',
                                value: text,
                                field_name: 'names',
                            })
                        }
                    />

                    <Button
                        title='Добави'
                        color='#841584'
                        accessibilityLabel='Добави нов клиент'
                        onPress={() => {
                            dispatch({
                                type: 'submit'
                            });

                            createUser({
                                email: email,
                                telephone: phone,
                                name: names,
                            });
                        }}
                    />

                    {error && <Text style={styles.error}>Грешка: {error}</Text>}

                    <Spinner
                        visible={isLoading}
                        textContent='Зарежда се ...'
                        textStyle={styles.spinnerTextStyle}
                    />

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        paddingTop: 30,
    },
    titleContainer: {
        alignItems: 'center'
    },
    titleText: {
        fontSize: 30,
        fontWeight: 'bold',
    },
    fieldsContainer: {
        margin: 20
    },
    fieldLabel: {
        fontSize: 15
    },
    textInput: {
        borderColor: 'grey',
        borderWidth: 1,
        height: 40,
        margin: 5,
        padding: 5
    },
    horizontalButtons: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    spinnerTextStyle: {
        color: '#FFF'
    },
    error: {
        color: 'red',
        fontSize: 15,
    }
});